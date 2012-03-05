"use strict";

var configuration = require('./configuration');
var fs = require('fs');
var path = require('path');

//private variables
var componentMap = {};
var plugins = [];

function ComponentRegistry() {
    registerPlugins(this);
    scanComponentFolder(this);
}

ComponentRegistry.PLUGIN_FOLDER = path.join(__dirname + '/registry');
ComponentRegistry.COMPONENT_METAFILE = 'meta.json';
ComponentRegistry.FOLDER_SERVER = 'server';
ComponentRegistry.FOLDER_CLIENT = 'client';
ComponentRegistry.FOLDER_RESOURCES = 'resources';
ComponentRegistry.FOLDER_CSS = ComponentRegistry.FOLDER_CLIENT + '/css';
ComponentRegistry.FOLDER_JS = ComponentRegistry.FOLDER_CLIENT + '/js';

/**
 * Registers the plugins for the component setup at server start
 */
function registerPlugins(self){
    var pluginFolder = 'registry';
    try {
        var dir = fs.readdirSync(ComponentRegistry.PLUGIN_FOLDER);
    } catch (e) {
        return;
    }

    dir.forEach(function(file) {
        try {
            var plugin = require(path.join(ComponentRegistry.PLUGIN_FOLDER, file));

            plugins.push(plugin);
            console.info("Loaded registry plugin: " + plugin.name);
        } catch (ex) {
            throw {
                message: 'Registry Plugin ' + file + 'is invalid.'
            };
        }
    });
}

function scanComponentFolder(self) {
    var componentsFolder = configuration.server.componentPath;
    var folders;    

    try {
        folders = fs.readdirSync(componentsFolder);
    } catch (ex) {
        throw {message: 'The components folder doesn\'t exist!', type: 'io'};
    }

    for (var i = 0, len = folders.length; i < len; i++) {
        var folder = folders[i];
        var componentPath = path.join(componentsFolder, folder);
        
        try {
            if (!fs.statSync(componentPath).isDirectory()) {
                break;
            }
        } catch (ex) {
            console.log('Failed to call stat for ' + componentPath);
            break;
        }        

        try {
            var metaFile = path.join(componentPath, ComponentRegistry.COMPONENT_METAFILE);
            var config = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
            registerComponent(self, config, folder);
            for(var j = plugins.length; j--;){
                plugins[j].configure(config);
            }
        } catch (ex) {
            console.log('Failed to load meta.json for ' + folder + ' component!');
        }
    }
}

function registerComponent(self, config, folder) {
    if (!config.id || !(/^(\d+\.)?(\d+\.)(\d+)$/.test(config.version))) {
        console.log('Component ' + JSON.stringify(config) + ' could not be registered');
        return;
    }

    var id = config.id;
    var version = config.version;

    config.folder = folder;

    if (!componentMap[id]) {
        componentMap[id] = {
            config: {},
            versions: []
        };
    }

    componentMap[id].config[version] = config;
    updateVersions(self, config);
}

/**
* Updates the versions list for the specified component. It ensures that the
* list is always sorted.
*
* @param {ComponentRegistry} self the ComponentContainer instance
* @param {Object} conf the configuration for the component
* @private
* @memberOf ComponentRegistry#
*/
function updateVersions(self, config) {
    var id = config.id;
    var version = getVersionParts(config.version, false);

    var versions = componentMap[id].versions;

    for (var i = versions.length; i--;) {
        if (compareVersions(version, versions[i]) > 0) {
            versions.splice(i + 1, 0, version);
            break;
        }
    }

    if (i === -1) {
        versions.unshift(version);
    }
}

/**
* Parses a version and returns an object containing the parts and the original
* version string. For fragments, an unspecified part is Infinity because in
* this case we need the latest version.
*
* @param {String} version the version to be parsed
* @param {Boolean} [isFragment] the type of the version: fragment or full
* version
* @returns {Object} the parsed version
* @private
* @memberOf ComponentRegistry#
*/
function getVersionParts(version, isFragment) {
    var versionParts = version.split('.');
    var major = parseInt(versionParts[0]);
    var minor = parseInt(versionParts[1]);
    var micro = parseInt(versionParts[2]);

    return {
        major: !isNaN(major) ? major : (isFragment ? Infinity : 0),
        minor: !isNaN(minor) ? minor : (isFragment ? Infinity : 0),
        micro: !isNaN(micro) ? micro : (isFragment ? Infinity : 0),
        versionStr: version
    };
}

/**
* Compares two versions and returns 1 if version1 is bigger than version2, 0 if
* they are equal or -1 if version1 is smaller than version2.
*
* @param {Object} version1 the first version to compare
* @param {Object} version2 the second version to compare
* @returns {Number} the result of the comparison
* @private
* @memberOf ComponentRegistry#
*/
function compareVersions(version1, version2) {
    var majorSign = compareNumbers(version1.major, version2.major);
    if (majorSign !== 0) {
        return majorSign;
    }

    var minorSign = compareNumbers(version1.minor, version2.minor);
    if (minorSign !== 0) {
        return minorSign;
    }

    return compareNumbers(version1.micro, version2.micro);
}

/**
* Compares two numbers and returns 1 if n1 is bigger than n2, 0 if they are
* equal or -1 if n1 is smaller than n2.
*
* @param {Number} n1 the first number to compare
* @param {Number} n2 the second number to compare
* @returns {Number} the result of the comparison
* @private
* @memberOf ComponentRegistry#
*/
function compareNumbers(n1, n2) {
    if (n1 === n2) {
        return 0;
    } else if (n1 < n2) {
        return -1;
    } else {
        return 1;
    }
}

ComponentRegistry.prototype.getConfig = function (id, version) {
    if (!componentMap[id] || !componentMap[id].config[version]) {
        return;
    }

    return componentMap[id].config[version];
};

/**
 * Returns the path of one of the predefined folders each component has.
 * Can return the relative path from the component folder or the full path
 * from the server root.
 * 
 * @param {String} id component id
 * @param {String} version component version
 * @param {String} type 'server' | 'client' | 'resources' | 'css' | 'js'
 * @param {Boolean} [full] true to return the full server path
 * @returns {String|undefined} the path to the requested folder or undefined if the component or folder is not found
 */
ComponentRegistry.prototype.getFolder = function (id, version, type, full) {
    var config = this.getConfig(id, version);
    if (typeof config === 'undefined') {
        return;
    }

    var folder = ComponentRegistry['FOLDER_' + type.toUpperCase()];

    if (typeof folder === 'undefined') {
        return
    }

    if (!full) {
        return folder;
    }

    return path.join(configuration.server.componentPath,
                     config.folder,
                     folder);
}

/**
* Returns the latest version for a component. This method also supports
* specifying version fragments in the second optional parameter. This means
* that if the provided version is "1", it will return the latest version that
* has "1" as its major version (like "1.8.5"). You can also specify an exact
* version in the fragment. If the component isn't found, it returns undefined.
* Also, if you provide a fragment that it is too big, it will return undefined
* (like 3.2 and the latest version is 2.5.3).
*
* @param {String} componentId the id of the component
* @param {String} [fragment] a version fragment
* @returns {String} the latest version of the component of undefined if it
* isn't found
*/
ComponentRegistry.prototype.getLatestVersion = function(componentId, fragment) {
    var versions = componentMap[componentId].versions;

    if (!versions) {
        return;
    }

    if (typeof fragment === 'undefined') {
        return versions[versions.length - 1].versionStr;
    }

    fragment = getVersionParts(fragment, true);

    // binary search
    var min = 0;
    var max = versions.length - 2; // mid + 1 must always exist
    while (min <= max) {
        var mid = Math.floor((min + max) / 2);
        var left = compareVersions(versions[mid], fragment);
        var right = compareVersions(versions[mid + 1], fragment);

        if (left <= 0 && right > 0) {
            if (isCompatible(versions[mid], fragment)) {
                return versions[mid].versionStr;
            }

            return;
        }

        if (left < 0) {
            min = mid + 1;
        } else {
            max = mid - 1;
        }
    }

    if (isCompatible(versions[versions.length - 1], fragment)) {
        return versions[versions.length - 1].versionStr;
    }

    return;
};

/**
* Determines if a version is compatible with a provided fragment. They are
* compatible if the numbers specified in the fragment are the same with the
* ones in the version (like 1 and 1.8.2 or 2.6 and 2.6.3).
*
* @param {Object} version the version to be checked
* @param {Object} fragment the version fragment against which the version
* should be checked
* @returns {Boolean} the result of the compatibility checks
* @private
* @memberOf ComponentRegistry#
*/
function isCompatible(version, fragment) {
    if (fragment.major === Infinity) {
        return true;
    }

    if (version.major === fragment.major) {
        if (fragment.minor === Infinity) {
            return true;
        }

        if (version.minor === fragment.minor) {
            if (fragment.micro === Infinity) {
                return true;
            }

            if (version.micro === fragment.micro) {
                return true;
            }
        }
    }

    return false;
}

module.exports = new ComponentRegistry();

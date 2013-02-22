// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";

var fs = require('fs'),
    path = require('path'),
    util = require('./util'),
    logger = require('./logging').get();

// Private variables

/**
 * Holds the configuration and versions for all the components.
 *
 * @type {Object}
 * @private
 * @memberOf ComponentRegistry
 */
var componentMap = {};

/**
 * Holds the server configuration.
 *
 * @type {Configuration}
 * @private
 * @memberOf ComponentRegistry
 */
var configuration = require('./configuration');

/**
 * Keeps components configuration and exposes an interface to obtain information about them.
 *
 * @name ComponentRegistry
 * @class Components configuration.
 * @constructor
 */
function ComponentRegistry() {}

/**
 * Registers the components, holds their configuration configures the plugins.
 *
 * @param {Configuration} config Instance of configuration module
 * @returns {ComponentRegistry} the class instance
 */
ComponentRegistry.prototype.initialize = function () {
    registerConfigComponents();

    // These components are required by RAIN because they provide core functionality.
    var requiredCoreComponents = [
        'core',
        'error',
        'placeholder'
    ];
    registerCoreComponents(requiredCoreComponents);

    // Holds the registered plugins for the component registry.
    var plugins = [
        'precompile_templates',
        'precompile_partials',
        'precompile_less',
        'websockets',
        'intents',
        'controller_path',
        'dynamic_conditions',
        'load_translation_files',
        'logging'
    ];
    registerPlugins(plugins);
    configurePlugins(plugins);

    return this;
};

/**
 * The name of the component configuration file. It is a constant.
 *
 * @type {String}
 * @memberOf ComponentRegistry
 */
ComponentRegistry.COMPONENT_METAFILE = 'meta.json';
ComponentRegistry.PLUGIN_FOLDER = path.join(__dirname + '/registry');
ComponentRegistry.FOLDER_SERVER = 'server';
ComponentRegistry.FOLDER_CLIENT = 'client';
ComponentRegistry.FOLDER_RESOURCES = 'resources';
ComponentRegistry.FOLDER_LOCALE = 'locale';
ComponentRegistry.FOLDER_CSS = ComponentRegistry.FOLDER_CLIENT + '/css';
ComponentRegistry.FOLDER_JS = ComponentRegistry.FOLDER_CLIENT + '/js';
ComponentRegistry.FOLDER_TEMPLATES = ComponentRegistry.FOLDER_CLIENT + '/templates';
ComponentRegistry.FOLDER_PARTIALS = ComponentRegistry.FOLDER_CLIENT + '/partials';

/**
 * Scans the component folders and register the components.
 *
 * @throws {RainError} when the components folder doesn't exist
 * @private
 * @memberOf ComponentRegistry#
 */
function registerConfigComponents() {
    var componentsFolders = configuration.server.components;
    var folders;

    for (var j = componentsFolders.length; j--;) {
        var componentsFolder = componentsFolders[j];
        try {
            folders = fs.readdirSync(componentsFolder);
        } catch (ex) {
            throw new RainError('The components folder: ' + componentsFolder + ' does not exist!',
                RainError.ERROR_IO);
        }

        for (var i = 0, len = folders.length; i < len; i++) {
            var folder = folders[i];
            var componentPath = path.join(componentsFolder, folder);

            try {
                if (!fs.statSync(componentPath).isDirectory()) {
                    continue;
                }
            } catch (ex) {
                logger.warn('Failed to call stat for ' + componentPath);
                continue;
            }

            scanComponent(componentPath);
        }
    }
}

/**
 * Scan a component's folder and register the component.
 *
 * @param {String} componentPath the component folder path
 * @private
 * @memberOf ComponentRegistry#
 */
function scanComponent(componentPath) {
    try {
        var metaFile = path.join(componentPath, ComponentRegistry.COMPONENT_METAFILE);
        var config = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
        registerComponent(config, componentPath);
    } catch (err) {
        logger.warn(util.format('Failed to load meta.json from %s folder!', componentPath), err);
    }
}

/**
 * Register the RAIN core components.
 *
 * @param {Array} requiredCoreComponents the list of required core components
 */
function registerCoreComponents(requiredCoreComponents) {
    var componentsFolders = configuration.server.components,
        rainCoreFolder = path.resolve(path.join(__dirname, '../components'));

    // Avoid registering twice the required components.
    for (var i = componentsFolders.length; i--;) {
        if (componentsFolders[i] === rainCoreFolder) {
            return;
        }
    }

    for (var i = requiredCoreComponents.length; i--;) {
        scanComponent(path.join(rainCoreFolder, requiredCoreComponents[i]));
    }
}

/**
 * Registers the plugins for the component setup at server start.
 *
 * @param {Array} plugins the list of registry plugins
 * @private
 * @memberOf ComponentRegistry#
 */
function registerPlugins(plugins) {
    for (var i = plugins.length; i--;) {
        try {
            var plugin = require(path.join(ComponentRegistry.PLUGIN_FOLDER, plugins[i]));

            plugins[i] = plugin;
            logger.info("Loaded registry plugin: " + plugin.name);
        } catch (ex) {
            throw new RainError('Registry Plugin %s is invalid.', [plugins[i]], RainError.ERR_IO);
        }
    }
}

/**
 * Configures the plugins for all components.
 *
 * @param {Array} plugins the list of registry plugins
 * @private
 * @memberOf ComponentRegistry#
 */
function configurePlugins(plugins) {
    var component;
    for (component in componentMap) {
        var versions = componentMap[component].config;
        for (var version in versions) {
            for (var j = plugins.length; j--;) {
                plugins[j].configure(versions[version]);
            }
        }
    }
}

/**
 * Adds the configuration for a component to the component map and adds the version
 * to the sorted list of versions
 *
 * @param {Object} config the configuration for a component
 * @param {String} folder the folder in which the component is placed
 * @private
 * @memberOf ComponentRegistry#
 */
function registerComponent(config, folder) {
    if (!config.id || !(/^(\d+\.)?(\d+\.)(\d+)$/.test(config.version))) {
        logger.warn('Component ' + JSON.stringify(config) + ' could not be registered.');
        return;
    }

    var id = config.id;
    var version = config.version;

    config.folder = folder;

    config.paths = function (type, full) {
        return getFolder(config, type, full);
    };

    if (!componentMap[id]) {
        componentMap[id] = {
            config: {},
            versions: []
        };
    }

    // prevent overriding an already registered component
    if (typeof componentMap[id].config[version] !== 'undefined') {
        logger.warn('The component ' + id + ';' + version + ' was deployed multiple times.');
        return;
    }

    componentMap[id].config[version] = config;
    updateVersions(config);
}

/**
 * Updates the versions list for the specified component. It ensures that the
 * list is always sorted.
 *
 * @param {Object} config the configuration for the component
 * @private
 * @memberOf ComponentRegistry#
 */
function updateVersions(config) {
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
 * @param {Boolean} [isFragment] the type of the version: fragment or full version
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

/**
 * Gets the configuration for a component.
 *
 * @param {String} id the id of the component
 * @param {String} version the version of the component
 * @returns {Object} the component configuration
 */
ComponentRegistry.prototype.getConfig = function (id, version) {
    if (!componentMap[id] || !componentMap[id].config[version]) {
        logger.warn(util.format('Couldn\'t get configuration for: %s;%s.', id, version));
        return;
    }

    return componentMap[id].config[version];
};

/**
 * Returns the path of one of the predefined folders each component has.
 * Can return the relative path from the component folder or the full path
 * from the server root.
 *
 * @param {String} type 'server' | 'client' | 'resources' | 'css' | 'js'
 * @param {Boolean} [full] true to return the full server path
 * @returns {String|undefined} the path to the requested folder or undefined if the component or folder is not found
 */
function getFolder(config, type, full) {
    if (typeof config === 'undefined') {
        return;
    }

    var folder = ComponentRegistry['FOLDER_' + type.toUpperCase()];

    if (typeof folder === 'undefined') {
        return;
    }

    if (!full) {
        return folder;
    }

    return path.join(config.folder, folder);
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
 * @returns {String} the latest version of the component of undefined if it isn't found
 */
ComponentRegistry.prototype.getLatestVersion = function (componentId, fragment) {
    var versions = componentMap[componentId] && componentMap[componentId].versions;

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
 * @param {Object} fragment the version fragment against which the version should be checked
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

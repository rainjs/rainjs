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
    util = require('../../lib/util'),
    color = require('colors'),
    utils = require('../lib/utils');

var NEWLINE = (process.platform === 'win32') ? '\r\n' :
    (process.platform === 'darwin') ? '\r' : '\n';

/**
 * @name NginxGenerator
 * @param {Object} configuration the basic configuration by default located in init/conf/nginx.conf
 * @constructor
 */
function NginxGenerator(configuration) {
    this._baseConfiguration = configuration;
    var fd; //destination file descriptor

    try {

        fd = fs.openSync(configuration.destinationPath, 'w');

    } catch (e) {
        console.log('Could not create the destination file.');
        console.log(e.message.red);
        console.log(e.stack.red);
        process.exit(1);
    }

    this._stream = fs.createWriteStream(configuration.destinationPath, {
        flags: 'w',
        encoding: 'utf-8',
        mode: '0644',
        fd: fd
    });
}

/**
 * Generates the configuration file by mapping the regexps of possible request routes with
 * actual correspondent. Generates configuration for javascript routes and resources and stores it
 * inthe root of the project.
 */
NginxGenerator.prototype.run = function () {
    var nginxConf = this._baseConfiguration.nginxConf,
        projects = this._baseConfiguration.projects,
        latestVersionMap = {},
        self = this;

    this._nginxLocations = nginxConf.http.server.locations;

    projects.forEach(function (project) {
        var componentsPath = path.join(project.path, 'components');

        fs.readdirSync(componentsPath).forEach(function (folder) {
            var componentPath,
                prodComponentPath,
                config;

            componentPath = path.join(componentsPath, folder);
            config = require(path.join(componentPath, 'meta.json'));

            //if a production path has been provided for the project, the component paths in the
            // config file will have that as base path
            if(project.productionPath) {
                prodComponentPath = path.join(project.productionPath, 'components', folder);
                self._addNginxLocations(prodComponentPath, config.id, config.version);
            } else {
                self._addNginxLocations(componentPath, config.id, config.version);
            }

            var latestVersion = latestVersionMap[config.id];

            if (!latestVersion ||
                self._compareVersions(config.version, latestVersion.version) > 0) {

                latestVersionMap[config.id] = {
                    version: config.version,
                    folder: prodComponentPath ? prodComponentPath : componentPath
                };
            }
        });
    });

    Object.keys(latestVersionMap).forEach(function (componentId) {
        self._addNginxLocations(latestVersionMap[componentId].folder, componentId);
    });

    this._writeConfiguration(nginxConf, 0);
    this._stream.end();
    console.log('NginX configuration generated successfully to ' +
        this._baseConfiguration.destinationPath);
};

/**
 * Adds the nginx locations for the specified component.
 *
 * @param {String} componentPath the component path
 * @param {String} id the component id
 * @param {String} version the component version
 * @private
 */
NginxGenerator.prototype._addNginxLocations = function (componentPath, id, version) {
    var jsRegex = 'location ~* %s/(js.*\\.js)$',
        resourceRegex = 'location ~* %s/(resources.*)$';

    var routeStart = id;
    if (version) {
        routeStart += '/' + version;
    }

    this._nginxLocations[util.format(jsRegex, routeStart)] = {
        alias: componentPath + '/client/$1'
    };

    this._nginxLocations[util.format(resourceRegex, routeStart)] = {
        alias: componentPath + '/$1'
    };
};

/**
 * Writes the nginx configuration to disk.
 *
 * @param {Object} config nginx configuration object
 * @param {Number} level the nesting level inside the config object
 * @private
 */
NginxGenerator.prototype._writeConfiguration = function (config, level) {
    for(var key in config) {
        if(key === 'locations') {
            this._writeConfiguration(config[key], level);
            continue;
        }

        this._indent(level);
        this._stream.write(key);

        if(typeof config[key] === 'object') {
            this._stream.write(' {' + NEWLINE);

            this._writeConfiguration(config[key], level + 1);

            this._indent(level);
            this._stream.write('}' + NEWLINE);
        } else {
            this._stream.write(' ' + config[key] + ';' + NEWLINE);
        }
    }
};

/**
 * Writes the specified number of tabs to file.
 *
 * @param {Number} level the number of tabs to write
 * @private
 */
NginxGenerator.prototype._indent = function (level) {
    for (var i = 0; i < level; i++) {
        this._stream.write('\t');
    }
};

/**
 * Compares two versions and returns 1 if version1 is bigger than version2, 0 if
 * they are equal or -1 if version1 is smaller than version2.
 *
 * @param {String} versionStr1 the first version to compare
 * @param {String} versionStr2 the second version to compare
 * @returns {Number} the result of the comparison
 */
NginxGenerator.prototype._compareVersions = function (versionStr1, versionStr2) {
    var version1 = this._getVersionParts(versionStr1),
        version2 = this._getVersionParts(versionStr2);

    var majorSign = this._compareNumbers(version1.major, version2.major);
    if (majorSign !== 0) {
        return majorSign;
    }

    var minorSign = this._compareNumbers(version1.minor, version2.minor);
    if (minorSign !== 0) {
        return minorSign;
    }

    return this._compareNumbers(version1.micro, version2.micro);
};

/**
 * Compares two numbers and returns 1 if n1 is bigger than n2, 0 if they are
 * equal or -1 if n1 is smaller than n2.
 *
 * @param {Number} n1 the first number to compare
 * @param {Number} n2 the second number to compare
 * @returns {Number} the result of the comparison
 */
NginxGenerator.prototype._compareNumbers = function (n1, n2) {
    if (n1 === n2) {
        return 0;
    } else if (n1 < n2) {
        return -1;
    } else {
        return 1;
    }
};

/**
 * Parses a version and returns an object containing the parts.
 *
 * @param {String} version the version to be parsed
 * @returns {Object} the parsed version
 */
NginxGenerator.prototype._getVersionParts = function (version) {
    var versionParts = version.split('.');
    var major = parseInt(versionParts[0]);
    var minor = parseInt(versionParts[1]);
    var micro = parseInt(versionParts[2]);

    return {
        major: !isNaN(major) ? major : 0,
        minor: !isNaN(minor) ? minor : 0,
        micro: !isNaN(micro) ? micro : 0
    };
};

module.exports = NginxGenerator;

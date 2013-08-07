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

var fs = require('fs');
var path = require('path');
var extend = require('node.extend');
var program = require('commander');

/**
 * Reads the server configuration file. It also validates the contents of this file
 * and sets the defaults. The configuration is a singleton.
 *
 * @name Configuration
 * @constructor
 *
 * @property {RainError} configurationError is the error that was caught when trying to load an invalid configuration file
 */
function Configuration() {
    load(this);

    setDefaults(this);
    processConfiguration(this);
    validate(this);
}

/**
 * Loads the configuration files and merges them into one JSON.
 *
 * @param {Configuration} self the class instance
 * @returns {Object} the content of the configuration file
 *
 * @private
 * @memberOf Configuration#
 */
function load(self) {
    var jsonConfigs = [],
        configurationDir = getConfigurationPath(),
        fileData, configurationFiles;

    try {
        configurationFiles = fs.readdirSync(configurationDir);
    } catch(e) {
        throw new RainError('The directory does not exist', RainError.ERROR_IO);
    }

    for(var i = 0, len = configurationFiles.length; i < len; i++) {
        if(path.extname(configurationFiles[i]) === ".conf") {
            var fileLocation = path.join(configurationDir, configurationFiles[i]);
            try {
                fileData = fs.readFileSync(fileLocation, 'utf8');
                jsonConfigs.push(JSON.parse(fileData));
            } catch (ex) {
                throw new RainError('An error occurred while reading ' + fileLocation ,
                        RainError.ERROR_IO);
            }
        }
    }

    if (jsonConfigs.length === 0) {
        throw new RainError('There are no configuration files in the directory',
                                              RainError.ERROR_IO);
    }

    jsonConfigs.unshift(self);
    extend.apply(null, jsonConfigs);
}

/**
 * Process the configuration information.
 *
 * @param {Configuration} self the class instance
 *
 * @private
 * @memberOf Configuration#
 */
function processConfiguration(self) {
    self.language = self.language || self.defaultLanguage;
    for (var i = self.server.components.length; i--;) {
        self.server.components[i] = path.resolve(self.server.components[i]);
    }
}

/**
 * Validates the configuration.
 *
 * @param {Configuration} self the class instance
 * @param {Object} confData the configuration object
 *
 * @private
 * @memberOf Configuration#
 */
function validate(self) {
    if (!self.defaultLanguage) {
        throw new RainError('The default language is missing',
                            RainError.ERROR_PRECONDITION_FAILED);
    }
    if (typeof self.cookieSecret === 'undefined') {
        throw new RainError('The cookieSecret is missing from credentials',
                RainError.ERROR_PRECONDITION_FAILED);
    }
    //TODO establish how the configuration data should be validated
}

/**
 * Sets the defaults.
 *
 * @param {Configuration} self the class instance
 *
 * @private
 * @memberOf Configuration#
 */
function setDefaults(self) {
    self.loadingComponent = self.loadingComponent || {
        "id": "placeholder",
        "version": "1.0",
        "viewId": "index",
        "timeout": 500
    };

    self.errorComponent = self.errorComponent || {
        "id": "error",
        "version": "1.0"
    };

    self.server = self.server || {};

    self.server.port = self.server.port || process.env.PORT || 1337;
    self.server.ip = self.server.ip || process.env.IP || '0.0.0.0';
}

/**
 * Get the configuration path for the RAIN server and reads all the configuration files.
 *
 * @returns {String[]} the configuration files name
 */
function getConfigurationPath() {
    var defaultConfDir = path.join(program.dir || process.cwd(), 'conf');
    return process.env.RAIN_CONF || defaultConfDir;
}

module.exports = new Configuration();

"use strict";

var fs = require('fs');
var path = require('path');
var extend = require('node.extend');
var program = require('commander');

/**
 * Reads the server configuration file. It also validates the contents of this file
 * and sets the defaults. The configuration is a singleton.
 *
 * @throws {RainError} when the server configuration file doesn't exist
 * @throws {RainError} when the server configuration file doesn't contain valid JSON
 *
 * @name Configuration
 * @constructor
 */
function Configuration() {
    var confData = load(this);

    setDefaults(this);
    extend(this, confData);
    processConfiguration(this);
    validate(this, confData);
}

/**
 * Loads the configuration file
 *
 * @param {Configuration} self the class instance
 * @returns {Object} the content of the configuration file
 * @throws {RainError} when the server configuration file doesn't exist
 * @throws {RainError} when the server configuration file doesn't contain valid JSON
 *
 * @private
 * @memberOf Configuration#
 */
function load(self) {
    var confData;
    try {
        confData = fs.readFileSync(getConfigurationPath(), 'utf8');
    } catch (ex) {
        throw new RainError('The server configuration file does not exist!', RainError.ERROR_IO);
    }

    try {
        confData = JSON.parse(confData);
        return confData;
    } catch(ex) {
        throw new RainError('The server configuration file does not contain valid JSON!' +
                            getConfigurationPath(), RainError.ERROR_IO);
    }
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

    self.server.serverRoot = path.resolve(self.server.serverRoot);

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
function validate(self, confData) {
    if (!self.defaultLanguage) {
        throw new RainError('The default language is missing',
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
    self.loadingComponent =  {
        "id": "placeholder",
        "version": "1.0",
        "viewId": "index",
        "timeout": 500
    };

    self.errorComponent = {
        "id": "error",
        "version": "1.0"
    };
}

/**
 * Get the configuration path for the RAIN server.
 *
 * @returns {String} the configuration path
 */
function getConfigurationPath() {
    var defaultConf = path.join(process.cwd(), 'conf', 'server.conf.default');
    return program.conf || process.env.RAIN_CONF || defaultConf;
}

module.exports = new Configuration();

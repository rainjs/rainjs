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

    validate(this, confData);
    setDefaults(this);
    extend(this, confData);

    this.server.serverRoot = path.resolve(this.server.serverRoot);
    for (var i = this.server.components.length; i--;) {
        this.server.components[i] = path.resolve(this.server.components[i]);
    }
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
        throw new RainError('The server configuration file does not contain valid JSON!',
                            RainError.ERROR_IO);
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
    var defaultConf = process.cwd() + '/conf/server.conf.default';
    return program.conf || process.env.RAIN_CONF || defaultConf;
}

module.exports = new Configuration();

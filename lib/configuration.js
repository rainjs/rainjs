"use strict";

var fs = require('fs');
var path = require('path');
var extend = require('node.extend');
var program = require('commander');

/**
 * Reads the server configuration file. It also validates the contents of this file and sets the defaults.
 * The configuration is a singleton.
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
    this.server.componentPath = path.resolve(this.server.componentPath);
}

/**
 * Loads the configuration file
 *
 * @param {Configuration} self the class instance
 * @returns {Object} the content of the configuration file
 * @throws {Error} when the server configuration file doesn't exist
 * @throws {Error} when the server configuration file doesn't contain valid JSON
 *
 * @private
 * @memberOf Configuration#
 */
function load(self) {
    var confData;
    try {
        confData = fs.readFileSync(getConfigurationPath(), 'utf8');
    } catch (ex) {
        throw {message: 'The server configuration file doesn\'t exist!', type: 'io'};       
    }

    try {
        confData = JSON.parse(confData);
        return confData;
    } catch(ex) {
        throw {message: 'The server configuration file doesn\'t contain valid JSON!', type: 'io'};
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
    self.loadingComponent = {
        "namespace": "",
        "selector": "placeholder",
        "module": "placeholder;1.0",
        "view": "/htdocs/index.html"
    };

    self.errorComponent = {
        "name": "error",
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


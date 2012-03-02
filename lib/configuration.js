"use strict";

var fs = require('fs');
var path = require('path');
var extend = require('node.extend');

/**
 * Reads the server configuration file. It also validates the contents of this file and sets the defaults.
 *
 * @param configPath the server configuration file path
 * @throws {Error} when configPath is not provided
 * @throws {Error} when the server configuration file doesn't exist
 * @throws {Error} when the server configuration file doesn't contain valid JSON
 *
 * @name Configuration
 * @constructor
 */
function Configuration(configPath) {
    if (!configPath) {
        throw {message: 'configPath is required!', type: 'argument'};
    }

    /**
     * The server configuration file path
     * @type {String}
     * @private
     * @memberOf Configuration#
     */
    this.configPath = configPath;

    var confData = load(this);

    validate(this, confData);
    setDefaults(this);
    extend(this, confData);

    this.server.serverRoot = path.resolve(this.server.serverRoot);
    this.server.documentRoot = path.resolve(this.server.documentRoot);
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
        confData = fs.readFileSync(self.configPath, 'utf8');
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

module.exports = Configuration;


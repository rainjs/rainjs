"use strict";

var mod_path = require('path'),
    logger = require('./logger.js').getLogger(mod_path.basename(module.filename));


/**
 * Validate the server configuration data. Throw errors if some required keys are missing.
 *
 * Set the default values for the keys that are optional in the configuration file.
 *
 * @param {Object} configServer the server configuration object
 * @throws {Error} when the parameter is not an object or when a required key is missing.
 */
function validate(configServer) {
    if (typeof configServer !== 'object') {
        var message = 'precondition failed: configuration must be an object!';
        logger.error(message);
        throw new Error(message);
    }
    if (!configServer.default_language) {
        var message = 'precondition failed: you must define a default locale e.g. "en_US" !';
        logger.error(message);
        throw new Error(message);
    }
    setDefaults(configServer);
}

/**
 * Set the default values for the keys that are optional and missing from the configuration file.
 *
 * @param {Object} configServer the server configuration object
 */
function setDefaults(configServer) {
    if (!configServer.loadingComponent) {
        configServer.loadingComponent = {
            "namespace": "",
            "selector": "placeholder",
            "module": "placeholder;1.0",
            "view": "/htdocs/index.html"
        };
    }

    if (!configServer.errorComponent) {
        configServer.errorComponent = {
            "name": "error",
            "version": "1.0"
        };
    }
}

module.exports = {
    validate: validate
};

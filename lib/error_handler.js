"use strict";

var path = require('path');
var fs = require('fs');
var componentRegistry = require("./component_registry");
var config = require('./configuration');

/**
 * Creates the ErrorHandler and loads the specified / default error component.
 *
 * @name ErrorHandler
 * @class
 * @constructor
 * @throws {RainError} when the error component is not specified or if it doesn't have the default view
 */
var ErrorHandler = function ErrorHandler() {
    var component = config.errorComponent;
    component.version = componentRegistry.getLatestVersion(component.id, component.version);
    if (component.version) {
        this.component = componentRegistry.getConfig(component.id, component.version);
        if (!this.component.views['default']) {
            throw new RainError('The error component doesn\'t have a default view!',
                                null, RainError.ERROR_PRECONDITION_FAILED);
        }
    } else {
        throw new RainError('No error component specified or default doesn\'t exist!',
                            null, RainError.ERROR_IO);
    }
};

/**
 * Renders an error view from a given status code.
 *
 * @param {Integer} statusCode the status code for the error
 * @returns {Object} The component and view for the status code
 */
ErrorHandler.prototype.getErrorComponent = function (statusCode) {
    if (!this.component.views[statusCode]) {
        statusCode = 'default';
    }

    return {
        component: this.component,
        view: statusCode
    };
};

module.exports = new ErrorHandler();

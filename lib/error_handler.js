"use strict";

var path = require('path');
var fs = require('fs');
var componentRegistry = require("./component_registry");
var config = require('./configuration');

/**
 * Creates the ErrorHandler and loads the specified / default error component.
 *
 * @name ErrorHandler
 * @constructor
 */
var ErrorHandler = function ErrorHandler() {
    var component = config.errorComponent;
    if(!component){
        component = { id: "error" };
    }
    component.version = componentRegistry.getLatestVersion(component.id, component.version);
    if (component.version) {
        this.component = componentRegistry.getConfig(component.id, component.version);
    } else {
        throw new RainError("No error component specified and default dosn't exist!", null, RainError.ERROR_IO);
    }
};

/**
 * Renders an error view from a given status code.
 *
 * @param {Integer} statusCode the status code for the error
 * @returns {Object} The component and view for the status code
 */
ErrorHandler.prototype.getErrorComponent = function (statusCode) {

    statusCode = statusCode || 'default';
    if (!this.component.views[statusCode] || !this.component.views['default']) {
        return undefined;
    }

    return {
        component: this.component,
        view: statusCode
    };
};

module.exports = new ErrorHandler();

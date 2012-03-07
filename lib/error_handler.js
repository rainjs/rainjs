"use strict";

var path = require('path');
var fs = require('fs');
var promise = require('promised-io/promise');
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
        console.log(this.component);
        this.component = componentRegistry.getConfig(component.id, component.version);
        console.log(this.component);
    } else {
        throw new RainError("No error component specified and default dosn't exist!", null, RainError.ERROR_IO);
    }
};

/**
 * Renders an error view from a given status code.
 *
 * @param {Integer} statusCode the status code for the error
 * @param {Error} exception the exception to be logged
 * @returns {Object} The component and view for the status code
 */
ErrorHandler.prototype.getErrorComponent = function (statusCode, exception) {
    // Log the exception.
    logException(exception || {}, statusCode || 500);

    // Construct the module string for the error component
    // so that we can include it into the taglib later.
    var errorView = this.component.views[statusCode].view;

    if (!errorView) {
        throw new RainError("The error component has no view for this status code!", null, RainError.ERROR_IO);
    }

    return {
        component: this.component,
        view: errorView
    };
};

/**
 * Logs the exception.
 *
 * @param {Object} exception
 * @param {Number} statusCode the HTTP status code that generated the exception
 * @private
 * @memberOf ErrorHandler#
 */
function logException(exception, statusCode) {
    console.error('Error: exception occurred with status code: ' + statusCode);
    if (exception.stack) {
        exception.stack.split('\n')
                .forEach(function (line) {
                    console.error(line);
                });
    } else if (exception.message) {
        console.error(exception.message);
    }
}

module.exports = new ErrorHandler();

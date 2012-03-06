"use strict";

var mod_path = require('path');
var mod_fs = require('fs');
var mod_promise = require('promised-io/promise');

/**
 * Creates an ErrorHandler instance.
 *
 * @name ErrorHandler
 * @class Provides methods for loading platform level views for specific HTTP error codes.
 * @param {ComponentContainer} componentContainer the component container instance to be used for getting the error component
 * @constructor
 */
var ErrorHandler = function ErrorHandler(componentContainer) {
    this.componentContainer = componentContainer;

    var component = Server.conf.errorComponent;
    component.version = componentContainer.getLatestVersion(component.name, component.version);
    if (component.version) {
        this.component = component;
    }
};

/**
 * Renders an error view from a given status code.
 *
 * @param {Integer} statusCode the status code for the error
 * @param {Error} exception the exception to be logged
 * @returns {Object} the tag lib entry for the error
 */
ErrorHandler.prototype.renderError = function (statusCode, exception) {
    // Log the exception.
    logException(exception || {}, statusCode || 500);

    if (!this.component) {
        return;
    }

    // Construct the module string for the error component
    // so that we can include it into the taglib later.
    var module = [this.component.name, this.component.version].join(';');

    var configuration = this.componentContainer.getConfiguration(module);
    var errorView = this.componentContainer.getViewByViewId(configuration, statusCode);

    if (!errorView) {
        return;
    }

    var selector = this.component.name + '_' +
                   this.component.version.replace(/[.]+/g, '_') + '_' + statusCode;

    return {
        namespace: '',
        selector: selector,
        module: module,
        view: errorView.view
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

/**
 * Escape a message.
 *
 * @param {String} message the message to escape
 * @returns {String} the escaped message
 * @private
 * @memberOf ErrorHandler#
 */
function escape(html) {
    return String(html)
            .replace(/&(?!\w+;)/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
};

module.exports = ErrorHandler;

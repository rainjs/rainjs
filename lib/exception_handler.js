"use strict";

var mod_path = require('path');
var mod_fs = require('fs');
var mod_promise = require('promised-io/promise');
var mod_logger = require('./logger.js').getLogger(mod_path.basename(module.filename));

/**
 * Creates an ExceptionHandler instance.
 *
 * @name ExceptionHandler
 * @class Provides methods for loading platform level views for specific HTTP error codes
 * @param {ComponentContainer} componentContainer the component container instance to be used for getting the exception component
 * @constructor
 */
var ExceptionHandler = function ExceptionHandler(componentContainer) {
    this.componentContainer = componentContainer;

    var component = Server.conf.errorPagesComponent || {module: 'exception'};
    component.version = componentContainer.getLatestVersion(component.module, component.version);
    if (component.version) {
        this.component = component;
    }
};

/**
 * Renders an exception view from a given status code and exception
 *
 * @param {Integer} statusCode the status code for the exception
 * @param {Error} exception the exception to be rendered
 * @returns {TagLib} the taglib for the exception
 */
ExceptionHandler.prototype.renderException = function (statusCode, exception) {
    // first things first, so let's log the exception
    logException(exception, statusCode);

    if (!this.component) {
        return;
    }

    // construct the module string for the exception component so that we can include it into the taglib later
    var module = [this.component.module, this.component.version].join(';');

    var configuration = this.componentContainer.getConfiguration(module);
    var exceptionView = this.componentContainer.getViewByViewId(configuration, statusCode);

    if(!exceptionView) {
        return;
    }

    return {
        namespace: '',
        selector: [this.component.name, statusCode].join('_'),
        module: module,
        view: exceptionView.view
    }
};

/**
 * Logs the exception.
 *
 * @param {Object} exception
 * @param {Number} statusCode the HTTP status code that generated the exception
 * @private
 * @memberOf ExceptionHandler#
 */
function logException(exception, statusCode) {
    mod_logger.error('Error: exception occurred with status code: ' + statusCode);
    if (exception.stack) {
        var lines = exception.stack.split('\n')
                .forEach(function (line) {
                    mod_logger.error(line);
                });
    } else if (exception.message) {
        mod_logger.error(message);
    }
}

/**
 * Escape a message.
 *
 * @param {String} message the message to escape
 * @returns {String} the escaped message
 * @private
 * @memberOf ExceptionHandler#
 */
function escape(html) {
    return String(html)
            .replace(/&(?!\w+;)/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
};

module.exports = ExceptionHandler;

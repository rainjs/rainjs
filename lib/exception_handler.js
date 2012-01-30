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
 * @param {String} [folder] the location folder of the exception pages. Default value is the 'public' folder in the serverRoot location.
 * @constructor
 */
var ExceptionHandler = function ExceptionHandler(folder) {
    if (typeof folder !== 'undefined') {
        this.publicFolder = folder;
    } else {
        this.publicFolder = Server.conf.server.serverRoot + '/public/';
    }
};

/**
 * Get the html page for an exception.
 *
 * @param {String} statusCode the exception status code
 * @param {Object} exception the exception
 * @returns {Object} an object with 'html' key if the page was found or 'error' key is the page is missing
 */
ExceptionHandler.prototype.getExceptionView = function(statusCode, exception) {
    if (!statusCode || !(new RegExp('^[0-9]{3}$').test(statusCode))) {
        statusCode = 500;
    }
    exception = exception || {};

    var defer = mod_promise.defer();

    var stylePath = mod_path.join(this.publicFolder, 'style.css');
    var errorPath = mod_path.join(this.publicFolder, statusCode + '.html');

    mod_fs.readFile(stylePath, 'utf8', function(errorStyle, style) {
        // If there's an error loading the style, ignore it since it's not critical
        if (errorStyle) {
            style = '';
        }

        mod_fs.readFile(errorPath, 'utf8', function(errorHtml, html) {
            if (errorHtml) {
                defer.resolve({
                    error: errorHtml
                });
                return;
            }
            var stack = (exception.stack || '').split('\n').slice(1)
                .map(function(v) {
                        return escape(v) + '<br />';
                 }).join('');
            var message = exception.message || '';
            html = html.replace('{style}', style)
                       .replace('{stack}', stack)
                       .replace('{error}', escape(message));
            defer.resolve({
                html: html
            });
        });
    });

    // Also log the exception
    logException(exception, statusCode);
    
    return defer.promise;
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


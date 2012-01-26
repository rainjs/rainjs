
"use strict";

var mod_path = require('path');
var mod_fs = require('fs');
var mod_promise = require('promised-io/promise');
var mod_logger = require('./logger.js').getLogger(mod_path.basename(module.filename));

/**
 * Exception handler class.
 *
 * @name ExceptionHandler
 * @class an instance of ExceptionHandler
 * @param {String} [folder] the location folder of the exception pages. Default value is the 'public' folder in the serverRoot location.
 * @constructor
 */
var ExceptionHandler = module.exports = function ExceptionHandler(folder) {
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
    if (!statusCode) {
        statusCode = 500;
    }
    var defer = mod_promise.defer();
    var stylePath = mod_path.join(this.publicFolder, 'style.css');
    var errorPath = mod_path.join(this.publicFolder, statusCode + '.html');
    mod_fs.readFile(stylePath, 'utf8', function(errorStyle, style) {
        if (errorStyle) {
            style = '';
        }
        mod_fs.readFile(errorPath, 'utf8', function(errorHtml, html) {
            if (errorHtml) {
                defer.resolve({
                    error: errorHtml
                });
                // The exception file could not be found. Log the error.
                if (typeof exception !== 'undefined') {
                    mod_logger.error(JSON.stringify(exception));
                }
                return;
            }
            exception = exception || {};
            var stack = (exception.stack || '').split('\n').slice(1)
                .map(function(v) {
                        return v + '<br />';
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
    return defer.promise;
};

/**
 * Escape a message.
 *
 * @param {String} message the message to escape
 * @returns {String} the escaped message
 * @private
 */
function escape(html) {
    return String(html)
            .replace(/&(?!\w+;)/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
};

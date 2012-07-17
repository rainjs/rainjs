// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";

var path = require('path'),
    util = require('../util'),
    config = require('../configuration'),
    Event = require('./event');

/**
 * The logger class.
 *
 * @param {Appender[]} The appenders used by the logger.
 *
 * @name Logger
 * @constructor
 */
function Logger(appenders) {
    /**
     * The appenders used by this logger.
     * @type Appender[]
     */
    this._appenders = appenders;
}

/**
 * Logger levels.
 * @type Object
 * @constant
 */
Logger.LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
};

/**
 * Logs a debug message.
 *
 * @param {String} message The message to be logged.
 * @param {RainError} error The associated error, if one exists.
 */
Logger.prototype.debug = function (message, error) {
    this._log('debug', message, error);
};

/**
 * Logs an info message.
 *
 * @param {String} message The message to be logged.
 * @param {RainError} error The associated error, if one exists.
 */
Logger.prototype.info = function (message, error) {
    this._log('info', message, error);
};

/**
 * Logs a warning message.
 *
 * @param {String} message The message to be logged.
 * @param {RainError} error The associated error, if one exists.
 */
Logger.prototype.warn = function (message, error) {
    this._log('warn', message, error);
};

/**
 * Logs an error message.
 *
 * @param {String} message The message to be logged.
 * @param {RainError} error The associated error, if one exists.
 */
Logger.prototype.error = function (message, error) {
    this._log('error', message, error);
};

/**
 * Logs a fatal error message. These are errors from which the server can't recover
 *
 * @param {String} message The message to be logged.
 * @param {RainError} error The associated error, if one exists.
 */
Logger.prototype.fatal = function (message, error) {
    this._log('fatal', message, error);
};

/**
 * Logs a message with the specified level.
 *
 * @param {String} level The level to use for logging the message.
 * @param {String} message The message to be logged.
 * @param {RainError} error The associated error, if one exists.
 */
Logger.prototype._log = function (level, message, error) {
    var event = new Event(level, message, error);
    for (var i = this._appenders.length; i--;) {
        this._appenders[i].append(event);
    }
};

/**
 * Calls the destroy method for the appenders it uses.
 */
Logger.prototype.destroy = function () {
    for (var i = this._appenders.length; i--;) {
        this._appenders[i].destroy();
    }
};

/**
 * The platform logger instance.
 * @type Logger
 */
Logger._instance = null;

/**
 * Keeps the constructors for platform appenders.
 * @type Object
 */
Logger._appenderConstructors = {};

/**
 * Keeps the constructors for platform layouts.
 * @type Object
 */
Logger._layoutConstructors = {};

/**
 * Gets the platform logger. At the first call, registers platform appenders and layouts and
 * initializes the logger.
 * @returns {Logger}
 * @throws {RainError} when the platform level is invalid.
 */
Logger.get = function () {
    if (!Logger._instance) {
        Logger._registerModules('appenders', Logger._appenderConstructors);
        Logger._registerModules('layouts', Logger._layoutConstructors);

        var appenders = [];

        if (typeof config.logger !== 'undefined') {
            if (typeof Logger.LEVELS[config.logger.level] === 'undefined') {
                throw new RainError('Invalid logger level: ' + config.logger.level);
            }

            for (var i = config.logger.appenders.length; i--;) {
                appenders.push(this._createAppender(config.logger.appenders[i]));

            }
        }

        Logger._instance = new Logger(appenders);
    }

    return Logger._instance;
};

/**
 * Registers the modules found in the specified directory. It reads all the JavaScript files
 * in that folder, requires them and add the modules to the object provided as parameter.
 *
 * @param {String} modulesPath The path in which to search for modules. This path is relative to the logger directory.
 * @param {Object} obj The object that holds the module references.
 * @throws {Error} when one of the modules throws an error when it is required
 */
Logger._registerModules = function (modulesPath, obj) {
    var dir = path.join(__dirname, modulesPath);

    util.walkSync(dir, ['.js'], function (filePath) {
        // the errors thrown by require aren't caught intentionally
        // the error can't be logged at this stage and the developer should see the actual error
        // it is OK that this error crashes the server
        var module = require(filePath);
        var moduleType = path.basename(filePath, '.js');
        obj[moduleType] = module;
    });
};

/**
* Creates an appender.
*
* @param {Object} options The options used to configure the appender.
* @param {String} options.[level] The level to be used by the appender. If it isn't specified the platform level is used.
* @param {String} options.type The appender type.
* @param {Object} options.layout The options for the layout used by the appender.
* @param {Object} options.[params] The appender options.
* @returns {Appender}
* throws {RainError} when the appender level is invalid
* throws {RainError} when the appender type is invalid
* throws {RainError} when layout options are empty
*/
Logger._createAppender = function (options) {
   var level = options.level || config.logger.level;

   if (typeof Logger.LEVELS[level] === 'undefined') {
       throw new RainError('Invalid appender level: ' + level);
   }

   var Appender = Logger._appenderConstructors[options.type];

   if (typeof Appender === 'undefined') {
       throw new RainError('Invalid appender type: ' + options.type);
   }

   if (typeof options.layout === 'undefined') {
       throw new RainError('No layout specified.');
   }

   var layout = Logger._createLayout(options.layout);

   return new Appender(level, layout, options.params);
};

/**
* Creates a layout.
*
* @param {Object} options The options used to configure the layout.
* @param {String} options.type The layout type.
* @param {Object} options.[params] The layout options.
* @returns {Layout}
* @throws {RainError} when the layout type is invalid
*/
Logger._createLayout = function (options) {
    var Layout = Logger._layoutConstructors[options.type];

    if (typeof Layout === 'undefined') {
       throw new RainError('Invalid layout type: ' + options.type);
   }

   return new Layout(options.params);
};

module.exports = Logger;

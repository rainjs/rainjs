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

var Event = require('./event'),
    Configurator = require('./configurator');

/**
 * The logger for the RAIN platform. The logging system is comprised of *loggers*, *appenders*
 * and *layouts*. Each logger can use multiple appenders and an appender uses one layout.
 * Appenders specify where the log should be written (console, file, database) and layouts specify
 * how a message should be formatted. RAIN implements two appenders: ``console`` and ``file`` and
 * one layout: ``pattern``.
 *
 * The platform logger configuration is placed in ``server.conf.default`` under the key ``logger``.
 * The following example configures the platform logger to use a console appender and a file
 * appender each of them using a pattern layout. The console appender inherits the level from
 * the platform level and the file appender specifies its own level, overriding the platform one::
 *
 *      "logger": {
 *          "level": "info",
 *          "appenders": [{
 *              "type": "console",
 *              "layout": {
 *                  "type": "pattern",
 *                  "params": {
 *                      "pattern": "[%level] %date: %message"
 *                  }
 *              },
 *              "params": {
 *                  "debug": {
 *                      "foreground": "green"
 *                  },
 *                  "info": {
 *                      "foreground": "cyan"
 *                  },
 *                  "warn": {
 *                      "foreground": "yellow"
 *                  },
 *                  "error": {
 *                      "foreground": "red"
 *                  },
 *                  "fatal": {
 *                      "foreground": "black",
 *                      "background": "red"
 *                  }
 *              }
 *          },
 *          {
 *              "level": "debug",
 *              "type": "file",
 *              "layout": {
 *                  "type": "pattern",
 *                  "params": {
 *                      "pattern": "[%source] [%level] %date %logger: %message%newline%stacktrace"
 *                  }
 *              },
 *              "params": {
 *                  "file": "/path/to/file"
 *              }
 *          }]
 *      }
 *
 * Component specific appenders can also be configured in ``meta.json``. Developers can use custom
 * appenders and layout by setting ``type`` to be ``custom`` and ``file`` to point to the JavaScript
 * file that implements the custom appender or layout (this path is relative to the ``server`` folder
 * of each component. The platform lever can't be set in the component specific configuration::
 *
 *      "logger": {
 *          "appenders": [{
 *              "type": "console",
 *              "level": "error",
 *              "layout": {
 *                  "type": "pattern",
 *                  "params": {
 *                      "pattern": "[%level] %date: %message"
 *                  }
 *              },
 *              "params": {
 *                  "debug": {
 *                      "foreground": "magenta"
 *                  },
 *                  "info": {
 *                      "foreground": "cyan"
 *                  },
 *                  "warn": {
 *                      "foreground": "yellow"
 *                  },
 *                  "error": {
 *                      "foreground": "red"
 *                  },
 *                  "fatal": {
 *                      "foreground": "black",
 *                      "background": "red"
 *                  }
 *              }
 *          },
 *          {
 *              "type": "custom",
 *              "file": "path/to/file.js",
 *              "level": "info",
 *              "layout": {
 *                  "type": "custom",
 *                  "file": "path/to/file.js"
 *              }
 *          }]
 *      }
 *
 * The logger can be used from both the server-side and client-side.
 *
 * RAIN’s logging system defines 5 log levels: ``debug``, ``info``, ``warn``, ``error`` and ``fatal``.
 *
 * In order to use the platform logger you need to obtain its reference by calling ``Logger.get``
 * and then you can write messages by calling one of its methods: ``debug``, ``info``, ``warn``,
 * ``error`` or ``fatal``::
 *
 *      var logger = require('./logging').get();
 *      logger.error('Error reading from file', error);
 *      logger.info('some message');
 *
 * @param {String} logger the logger name
 * @param {Appender[]} appenders The appenders used by the logger.
 * @param {Appender[]} [inheritedAppenders] The appenders inherited by a component logger from the platform logger.
 *
 * @name Logger
 * @constructor
 */
function Logger(logger, appenders, inheritedAppenders) {
    /**
     * The appenders used by this logger.
     * @type Appender[]
     */
    this._appenders = appenders;

    /**
     * The appenders inherited by this logger.
     * @type Appender[]
     */
    this._inheritedAppenders = inheritedAppenders || [];

    /**
     * Array containing all the appenders
     * @type Appender[]
     */
    this._allAppenders = this._appenders.concat(this._inheritedAppenders);

    /**
     * The name of the logger
     * @type String
     */
    this._logger = logger;
}

/**
 * Defines numeric values for the logger levels.
 *
 * @type Object
 * @constant
 */
Logger.LEVELS = require('./logger_levels');

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
 * Logs a fatal error message. These are errors from which the server can't recover.
 *
 * @param {String} message The message to be logged.
 * @param {RainError} error The associated error, if one exists.
 */
Logger.prototype.fatal = function (message, error) {
    this._log('fatal', message, error);
};

/**
 * Renames the actual log file and restarts the logger;
 */
Logger.rotate = function () {
    for (var key in Logger._componentLoggers) {
        Logger._componentLoggers[key]._rotate();
    }

    Logger._platformLogger._rotate();
};

/**
 * Logs a message with the specified level.
 *
 * @param {String} level The level to use for logging the message.
 * @param {String} message The message to be logged.
 * @param {RainError} error The associated error, if one exists.
 * @param {String} source the event source: client side or server side
 */
Logger.prototype._log = function (level, message, error, source) {
    var event = new Event(level, message, error, this._logger, source || 'SERVER');
    for (var i = this._allAppenders.length; i--;) {
        this._allAppenders[i].append(event);
    }
};

/**
 * Calls the destroy method for the appenders it uses.
 */
Logger.prototype._destroy = function () {
    for (var i = this._appenders.length; i--;) {
        this._appenders[i].destroy();
    }
};

/**
 * Calls the rotate method for the appenders it uses.
 */
Logger.prototype._rotate = function () {
    for (var i = this._appenders.length; i--;) {
        this._appenders[i].rotate();
    }
};

/**
 * The platform logger instance.
 * @type Logger
 */
Logger._platformLogger = null;

/**
 * Component loggers map;
 * @type Object
 */
Logger._componentLoggers = {};

/**
 * Initializes and returns the platform or component logger.
 *
 * @param [component] The component for which to create the logger. Creates the platform logger if component is undefined.
 * @param component.id The component id.
 * @param component.version The component version.
 * @returns {Logger}
 * @throws {RainError} when the platform level is invalid.
 */
Logger.get = function (component) {
    if (!Logger._platformLogger) {
        Logger._platformLogger = new Logger('RAIN', Configurator.get().getAppenders());
    }

    if (!component) {
        return Logger._platformLogger;
    } else if (typeof component === 'string') {
        if (!Logger._socketIO) {
            Logger._socketIO = new Logger('socketIO', Configurator.get().getAppenders());
            // SocketIO debug messages don't offer useful information, so just ignore them.
            Logger._socketIO.info = Logger._socketIO.debug;
            Logger._socketIO.debug = function () {};
        }
        return Logger._socketIO;
    }

    // component logger
    var cid = component.id + ';' + component.version;

    if (!Logger._componentLoggers[cid]) {
        var appenders = Configurator.get().getAppenders(component);
        Logger._componentLoggers[cid] = new Logger(cid, appenders, Logger._platformLogger._appenders);
    }

    return Logger._componentLoggers[cid];
};

/**
 * Destroys all the loggers.
 */
Logger.destroyAll = function () {
    for (var key in Logger._componentLoggers) {
        Logger._componentLoggers[key]._destroy();
    }

    Logger._platformLogger._destroy();
};

module.exports = Logger;

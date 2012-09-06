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

define(['raintime/messaging/sockets'], function (Sockets) {

    /**
     * The logger for the RAIN components. It uses a websocket so send the logging event to the
     * server side, where it will be consumed by the appenders.
     *
     * @name Logger
     * @class
     * @constructor
     *
     * @param {Object} component the component properties
     */
    function Logger(component) {
        this._component = component;
        this._logQueue = [];

        var channel = '/core/logging';
        if (component) {
            channel = '/' + component.id + (component.version ? '/' + component.version : '') +
                          '/logging';
        }
        this._socket = Sockets.getSocket(channel);
    }

    /**
     * Defines numeric values for the logger levels.
     *
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
     * A map that holds the logger objects.
     *
     * @type {Object}
     * @private
     */
    var instances = {};

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
     * Logs a message with the specified level.
     *
     * @param {String} level The level to use for logging the message.
     * @param {String} message The message to be logged.
     * @param {RainError} error The associated error, if one exists.
     */
    Logger.prototype._log = function (level, message, error) {
        var event = {
            level: level,
            message: message,
            error: error
        };

        if (this._socket.socket.connected) {
            if (this._logQueue.length) {
                for (var i = 0, len = this._logQueue.length; i < len; i++) {
                    this._socket.emit('log', this._logQueue[i]);
                }
                this._logQueue = [];
            }
            this._socket.emit('log', event);
        } else {
            this._logQueue.push(event);
        }
    };

    /**
     * Gets the component's logger instance.
     *
     * @param {Object} component the component properties
     * @returns {Logger}
     */
    Logger.get = function (component) {
        var id = 'core';
        if (component) {
            id = component.id + ' ' + component.version;
        }

        return instances[id] || (instances[id] = new Logger(component));
    };

    return Logger;
});

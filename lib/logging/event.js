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

/**
 * Represents a logger event.
 *
 * @param {Number} level The level of the event.
 * @param {String} message The log message.
 * @param {RainError} error The error associated with the log message.
 * @param {String} logger the logger name
 * @param {String} source the log statement location: 'server' or 'client'
 *
 * @name Event
 * @class
 * @constructor
 */
function Event(level, message, error, logger, source) {
    this._level = level;
    this._message = message;
    this._date = new Date();
    this._error = error;
    this._logger = logger;
    this._source = source;
}

/**
 * Gets the event level.
 *
 * @returns {Number}
 */
Event.prototype.level = function () {
    return this._level;
};

/**
 * Gets the event message.
 *
 * @returns {String}
 */
Event.prototype.message = function () {
    return this._message;
};

/**
 * Gets the date at which the event was generated.
 *
 * @returns {Date}
 */
Event.prototype.date = function () {
    return this._date;
};

/**
 * Gets the error associated with the log message.
 *
 * @returns {RainError}
 */
Event.prototype.error = function () {
    return this._error;
};

/**
 * Gets the name of the logger.
 *
 * @returns {String}
 */
Event.prototype.logger = function () {
    return this._logger;
};

/**
 * Gets the event source.
 *
 * @returns {String}
 */
Event.prototype.source = function () {
    return this._source;
};

module.exports = Event;

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

var Logger = require('./logger');

/**
 * Abstract appender class.
 *
 * @name Appender
 * @constructor
 */
function Appender (level, layout) {
    this._level = level;
    this._layout = layout;
}

/**
 * Appends a message to the log.
 *
 * @param {Event} event The event to be appended to the log.
 */
Appender.prototype.append = function (event) {
    if (Logger.LEVELS[this._level] <= Logger.LEVELS[event.level()]) {
        var message = this._layout.format(event);
        this._write(message, event);
    }
};

/**
 * Writes the message in the log storage. This is an abstract method that needs to be implemented
 * by the concrete appenders.
 *
 * @param {String} message The message to be added to the log.
 * @param {Event} event The event to be appended to the log.
 * @protected
 */
Appender.prototype._write = function (message, event) {};

/**
 * Abstract method that needs to be implemented when an appender needs to clean up before it is
 * destroyed.
 */
Appender.prototype.destroy = function () {};

module.exports = Appender;

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

var util = require('util'),
    Syslog = require('node-syslog'),
    Appender = require('../appender');

/**
 * Log level to syslog level associations.
 */
var _level = {
    "debug": "LOG_DEBUG",
    "info": "LOG_INFO",
    "warn": "LOG_WARNING",
    "error": "LOG_ERR",
    "fatal": "LOG_CRIT"
};

/**
 * The syslog appender class is used for redirecting the log output to the syslog service:
 *
 *      {
 *          "level": "debug",
 *          "type": "syslog",
 *          "layout": {
 *              "type": "pattern",
 *              "params": {
 *                  "pattern": "[%level] %date %logger: %message%newline%stacktrace"
 *              }
 *           },
 *           "params": {
 *               "identity": "",
 *               "facility": "LOCAL0"
 *           }
 *      }
 *
 * @param {String} level the log level for this instance
 * @param {Layout} layout the log layout to use
 * @param {Object} options the configuration options
 * @param {String} options.file the file to write to
 * @param {String} [options.identity] a string to be added to every log message (default is "")
 * @param {String} [options.facility] the syslog facility to log into (default is "LOCAL0")
 *
 * @name SyslogAppender
 * @constructor
 */
function SyslogAppender(level, layout, options) {
    Appender.call(this, level, layout);
    this._options = options || {};
    Syslog.init(this._options.identity || "",
                Syslog.LOG_PID | Syslog.LOG_ODELAY,
                Syslog["LOG_" + (String(this._options.facility).toUpperCase() || "LOCAL0")]);
}
util.inherits(SyslogAppender, Appender);

/**
 * Write a message to the log.
 *
 * @param {String} message the message to write
 * @param {Event} event the log event
 */
SyslogAppender.prototype._write = function (message, event) {
    Syslog.log(Syslog[_level[event.level()]], message);
};

/**
 * Destroy the appender.
 */
SyslogAppender.prototype.destroy = function () {
    Syslog.close();
};

module.exports = SyslogAppender;

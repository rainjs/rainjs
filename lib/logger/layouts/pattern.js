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
 * Pattern layout implementation.
 *
 * @name PatternLayout
 * @class
 * @constructor
 *
 * @throws {RainError} if the params parameter is missing required keys
 */
function PatternLayout(params) {
    if (!params || typeof params.pattern !== 'string') {
        throw new RainError('', RainError.ERROR_PRECONDITION_FAILED);
    }
    this._params = params;

    this._placeholders = {
        'date':
            function (event) {
                var date = event.date,
                    day = date.getDate(),
                    month = date.getMonth() + 1,
                    year = date.getFullYear(),
                    hour = date.getHours(),
                    minute = date.getMinutes(),
                    second = date.getSeconds();
                return (month < 10 ? '0' + month : month) + '.' +
                       (day < 10 ? '0' + day : day) + '.' + year + ' - ' +
                       (hour < 10 ? '0' + hour : hour) + ':' +
                       (minute < 10 ? '0' + minute : minute) + ':' +
                       (second < 10 ? '0' + second : second);
            },
        'level':
            function (event) {
                return event.level;
            },
        'logger':
            function (event) {
                return event.name;
            },
        'message':
            function (event) {
                return event.message;
            },
        'newline':
            function (event) {
                return '\n';
            },
        'stacktrace':
            function (event) {
                return event.error && event.error.stack;
            }
    };

    var pattern = '';
    for (var key in this._placeholders) {
        pattern += '%' + key + '|';
    }
    pattern += '%%';

    this._pattern = pattern;
}

/**
 * Compose a log message based on the layout pattern and the current log event.
 *
 * @param {Object} event the log event
 * @param {String} event.level the logging level
 * @param {String} event.date the message date
 * @param {String} event.name the logger name
 * @param {RainError} [event.error] the error
 * @returns
 */
PatternLayout.prototype.format = function (event) {
    var self = this,
        regExp = new RegExp(this._pattern, 'gi'),
        str = this._params.pattern;

    str = str.replace(regExp, function (match) {
        if (match == '%%') {
            return '%';
        }
        if (self._placeholders[match.substring(1)]) {
            return self._placeholders[match.substring(1)](event) || '';
        }
        return match;
    });

    return str;
};

module.exports = PatternLayout;

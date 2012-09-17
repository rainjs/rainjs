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
    Appender = require('../appender');

/**
 * Colored console appender::
 *
 *      {
 *          "type": "console",
 *          "layout": {
 *              "type": "pattern",
 *              "params": {
 *                  "pattern": "[%level] %date: %message"
 *              }
 *          },
 *          "params": {
 *              "debug": {
 *                  "foreground": "green"
 *              },
 *              "info": {
 *                  "foreground": "cyan"
 *              },
 *              "warn": {
 *                  "foreground": "yellow"
 *              },
 *              "error": {
 *                  "foreground": "red"
 *              },
 *              "fatal": {
 *                  "foreground": "black",
 *                  "background": "red"
 *              }
 *          }
 *      }
 *
 * @param {Number} level the level
 * @param {Layout} layout the layout
 * @param {Object} options the colors configuration
 *
 * @name ConsoleAppender
 * @class
 * @constructor
 */
function ConsoleAppender(level, layout, options) {
    Appender.call(this, level, layout);

    this._options = options;
}

util.inherits(ConsoleAppender, Appender);

/**
 * Constants for foreground colors.
 */
ConsoleAppender.FOREGROUND_COLORS = {
    'black'     : ['\u001b[30m', '\u001b[39m'],
    'red'       : ['\u001b[31m', '\u001b[39m'],
    'green'     : ['\u001b[32m', '\u001b[39m'],
    'yellow'    : ['\u001b[33m', '\u001b[39m'],
    'blue'      : ['\u001b[34m', '\u001b[39m'],
    'magenta'   : ['\u001b[35m', '\u001b[39m'],
    'cyan'      : ['\u001b[36m', '\u001b[39m'],
    'white'     : ['\u001b[37m', '\u001b[39m'],
    'grey'      : ['\u001b[90m', '\u001b[39m'],
    'default'   : ['', '']
};

/**
 * Constants for background colors.
 */
ConsoleAppender.BACKGROUND_COLORS = {
    'black'     : ['\u001b[40m', '\u001b[49m'],
    'red'       : ['\u001b[41m', '\u001b[49m'],
    'green'     : ['\u001b[42m', '\u001b[49m'],
    'yellow'    : ['\u001b[43m', '\u001b[49m'],
    'blue'      : ['\u001b[44m', '\u001b[49m'],
    'magenta'   : ['\u001b[45m', '\u001b[49m'],
    'cyan'      : ['\u001b[46m', '\u001b[49m'],
    'white'     : ['\u001b[47m', '\u001b[49m'],
    'grey'      : ['\u001b[100m', '\u001b[49m'],
    'default'   : ['', '']
};

/**
 * Writes the message to the console.
 *
 * @param {String} message the message to log
 * @param {Event} event the log event
 */
ConsoleAppender.prototype._write = function (message, event) {
    if (process.platform === 'win32') {
        console.log(message);
    } else {
        var colors = this._options[event.level()],
            foreground = colors['foreground'] || 'default',
            background = colors['background'] || 'default',
            output = '';

        if (typeof ConsoleAppender.FOREGROUND_COLORS[foreground] === 'undefined') {
            foreground = 'default';
        }

        if (typeof ConsoleAppender.BACKGROUND_COLORS[background] === 'undefined') {
            background = 'default';
        }

        output += ConsoleAppender.FOREGROUND_COLORS[foreground][0];
        output += ConsoleAppender.BACKGROUND_COLORS[background][0];
        output += message;
        output += ConsoleAppender.FOREGROUND_COLORS[foreground][1];
        output += ConsoleAppender.BACKGROUND_COLORS[background][1];

        console.log(output);
    }
};

module.exports = ConsoleAppender;

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
    fs = require('fs'),
    Appender = require('../appender'),
    moment = require('moment');

var NEWLINE = ('win32' === process.platform) ? '\r\n' :
              ('darwin' === process.platform) ? '\r' : '\n';

/**
 * The file appender class is used for redirecting the log output to a file::
 *
 *      {
 *          "level": "debug",
 *          "type": "file",
 *          "layout": {
 *              "type": "pattern",
 *              "params": {
 *                  "pattern": "[%level] %date %logger: %message%newline%stacktrace"
 *              }
 *           },
 *           "params": {
 *               "file": "/path/to/file",
 *               "encoding": "utf-8",
 *               "mode": "0644"
 *           }
 *      }
 *
 * Rotate is a method through which you can rename the logs for a period of time to a specified format
 * and restart logging fresh.
 *
 * As a third party developer if you want to trigger this log rotation you  need to:
 *
 *  - Have a configuration in the server conf for this rotation file;
 *     .. code-block:: javascript
 *         :linenos:
 *
 *           "logger": {
 *               "level": "debug",
 *               "appenders": [{
 *                   "type": "file", //type of the appender
 *                   "layout": {
 *                       "type": "pattern",
 *                       "params": {
 *                           "pattern": "%logger - %source - [%level] %date: %message %stacktrace"
 *                       }
 *                   },
 *                   "params": {
 *                       "file": "server.log", //where to append the logs
 *                       "rotateFile": {
 *                           ["path": "server.log"], //name of the renamed server.log
 *                           ["format": "dd-mm-yyyy.hh:mm"], //add to the name this specific format
 *                           ["day": "-1"] //log for the day before.
 *                       }
 *                   }
 *               }]
 *           }
 *
 *  - Send a SIGUSR2 signal to the raind process.
 *       .. code-block:: guess
 *
 *           kill -SIGUSR2 [pid of raind]
 *
 * @param {String} level the log level for this instance
 * @param {Layout} layout the log layout to use
 * @param {Object} options the configuration options
 * @param {String} options.file the file to write to
 * @param {String} [options.encoding='utf-8'] the encoding to use for the log file
 * @param {String} [options.mode='0644'] the permissions to use when creating a new log file
 *
 * @name FileAppender
 * @constructor
 */
function FileAppender(level, layout, options) {
    Appender.call(this, level, layout);

    if (!options || !options.file) {
        throw new RainError('You need to specify a log file for the file appender',
            RainError.ERROR_PRECONDITION_FAILED);
    }

    this._options = options;

    this._stream = this._createStream();

    this._stream.on('error', function (e) {
        throw new RainError('Error loging to file: ' + e.message, RainError.ERROR_IO);
    });
}

util.inherits(FileAppender, Appender);

/**
 * Creates a fs WriteStream depending on the options passed to the constructor.
 *
 * @private
 * @returns {Stream} the created fs Writting Stream.
 */
FileAppender.prototype._createStream = function () {
    var fd = fs.openSync(this._options.file, 'a');

    return fs.createWriteStream(this._options.file, {
        flags: 'a',
        encoding: this._options.encoding || 'utf-8',
        mode: this._options.mode || '0644',
        fd: fd
    });
};

/**
 * Write a message to the log.
 *
 * @param {String} message the message to write
 */
FileAppender.prototype._write = function (message) {
    if (!this._stream.writable) {
        return;
    }

    this._stream.write(message + NEWLINE);
};

/**
 * Destroy the appender.
 */
FileAppender.prototype.destroy = function () {
    if (!this._stream.writable) {
        return;
    }

    this._stream.end();
};

/**
 * Renames the actual log file and restarts the logger;
 */
FileAppender.prototype.rotate = function () {
    var logger = require('rain/lib/logging').get();

    if (!this._stream.writable) {
        return;
    }

    if (!this._options.rotateFile) {
        logger.error('There is no rotateFile in config');
        return;
    }

    var dateFormat = this._options.rotateFile.format || 'DD-MM-YYYY HH:mm',
        destination = this._options.rotateFile.path || this._options.file,
        days = this._options.rotateFile.day || 0;

    try {
        var format = moment().add('days', days).format(dateFormat),
            rotateLogFile = destination + '.' + format;

        this._stream.end();
        fs.renameSync(this._options.file, rotateLogFile);
        this._stream = this._createStream();

        logger.debug('Successfully rotated log: ' + this._options.file);
    } catch (e) {
        logger.error('Failed to rotate log for: ' + this._options.file, e);
    }
};

module.exports = FileAppender;

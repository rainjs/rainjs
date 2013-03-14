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

var util = require('../../util'),
    fs = require('fs'),
    Appender = require('../appender');

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
 * @param {String} level the log level for this instance
 * @param {Layout} layout the log layout to use
 * @param {Object} options the configuration options
 * @param {String} options.file the file to write to
 * @param {String} [options.encoding='utf-8'] the encoding to use for the log file
 * @param {String} [options.mode='0644'] the permissions to use when creating a new log file
 *
 * @name FileAppender
 * @class
 * @constructor
 */
function FileAppender(level, layout, options) {
    Appender.call(this, level, layout);

    if (!options || !options.file) {
        throw new RainError('You need to specify a log file for the file appender',
            RainError.ERROR_PRECONDITION_FAILED);
    }
    this._options = options;

    var fd = fs.openSync(options.file, 'a');

    this._stream = fs.createWriteStream(options.file, {
        flags: 'a',
        encoding: options.encoding || 'utf-8',
        mode: options.mode || '0644',
        fd: fd
    });

    this._stream.on('error', function (e) {
        throw new RainError('Error loging to file: ' + e.message,
            RainError.ERROR_IO);
    });
}

util.inherits(FileAppender, Appender);

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
 * Format the date according to the config format and day flag in the config.
 * If the flag is ``-1`` than it goes to the previous day.
 */
function formatDate(date, format, flag) {
    var extensions = format.split("."),
        dateFormatters = extensions[0].split("-"),
        splitDate = date.toString().split(" "),
        hourFormatters = [], 
        dayOutput = [],
        timeOutput = [];

    if(extensions[1]) {
        hourFormatters = extensions[1].split(":");
        var splitTime = splitDate[4].split(":");
        for(var i=0, len=hourFormatters.length; i < len; i++) {
            switch(hourFormatters[i]) {
                case 'hh':
                    timeOutput.push(splitTime[0]);
                    break;
                case 'mm':
                    timeOutput.push(splitTime[1]);
                case 'ss':
                    timeOutput.push(splitTime[2]);
            }
        }
    }

    for(var i=0, len=dateFormatters.length; i < len; i++) {
        switch(dateFormatters[i]) {
            case 'dd': 
                dayOutput.push(splitDate[2]);
                break;
            case 'mm':
                dayOutput.push(splitDate[1]);
                break;
            case 'yyyy':
                dayOutput.push(splitDate[3]);
                break;
            case 'yy' :
                dayOutput.push(splitDate[3].substring(2,3));
                break;
            default: 
                break;
        }
    }

    //TODO: should I check the hour or just go back one day?
    if(flag === '-1' && timeOutput.length !== 0) {
        if(dayOutput[0] === '1') {
            date.setDate(-1);
        } else {
            date.setDate(parseInt(dayOutput[0], 10) - 1);
        }
        return formatDate(date, format, 0);
    }

    dayOutput = dayOutput.join('-');
    timeOutput = timeOutput.join(':');

    return (dayOutput+'.'+timeOutput);
}


/**
 * Renames the actual log file and restarts the logger;
 */
FileAppender.prototype.rotate = function () {
    var self = this;
    if (!this._stream.writable) {
        return;
    }

    var date = new Date();

    if(!self._options.rotateFile) {
        logger.error('There is no rotateFile in config');
        return;
    } else {
        if(!self._options.rotateFile.path) {
            logger.error('There is no path for the rotateFile');
            return;
        }
        if(!self._options.rotateFile.format) {
            console.log('hmm3');
            logger.error('There is no format for the rotateFile');
            return;
        }
    }

    var rotateLogFile = self._options.rotateFile.path + '.' +
                        formatDate(date, self._options.rotateFile.format, 
                                self._options.rotateFile.day);

    //waits for the pipe to be written than it is drained
    this._stream.destroySoon();
    //stop the world - this is ok because for a second nothing will be done
    fs.renameSync(self._options.file, rotateLogFile);
    var fd = fs.openSync(self._options.file, 'a');
    //restart log writting
    this._stream = fs.createWriteStream(self._options.file, {
        flags: 'a',
        encoding: self._options.encoding || 'utf-8',
        mode: self._options.mode || '0644',
        fd: fd
    });
    logger.debug('Log rotation file created sucessfull');
};

module.exports = FileAppender;

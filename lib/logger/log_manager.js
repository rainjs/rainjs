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

var fs = require('fs'),
    path = require('path'),
    util = require('../util');

/**
 * Initializes the modules needed for the logger and creates the logger instance.
 *
 * @name LogManager
 * @constructor
 */
function LogManager () {
    this._appenders = {};
    this._layouts = {};

    this._registerModules('appenders', this._appenders);
    this._registerModules('layouts', this._layouts);
}

/**
 * Registers the modules found in the specified directory. It reads all the JavaScript files
 * in that folder, requires them and add the modules to the object provided as parameters.
 *
 * @param {String} modulesPath The path in which to search for modules. This path is relative to the logger directory.
 * @param {Object} obj The object that holds the module references.
 * @throws {Error} when one of the modules throws an error when it is required
 */
LogManager.prototype._registerModules = function (modulesPath, obj) {
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
 * Creates the logger instance
 * @returns {Logger} the platform logger
 */
LogManager.prototype.getLogger = function () {

};

/**
 * LogManager instance.
 * @type LogManager
 */
LogManager._instance = null;

/**
 * Returns the LogManager instance
 * @returns {LogManager}
 */
LogManager.getInstance = function () {
    return LogManager._instance || (LogManager._instance = new LogManager());
};

module.exports = LogManager;

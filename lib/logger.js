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

var console = require('console'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),
    program = require('commander'),
    config = require('./configuration');

function Logger() {
    extendConsole();
}

function extendConsole() {
    var fd = process.stdout,
        fdError = process.stderr;

    if(program.daemon && process.platform != 'darwin' && process.platform != 'win32') {
        try {
            var fdPath = path.join(config.server.serverRoot, config.server.logs.access);
            if (!path.existsSync(path.dirname(fdPath))) {
                fs.mkdirSync(path.dirname(fdPath));
            }
            fd = fs.createWriteStream(fdPath, {
                flags: 'a+',
                encoding: 'utf8'
            });
        } catch (e) {}
        
        try {
            var fdPath = path.join(config.server.serverRoot, config.server.logs.error);
            if (!path.existsSync(path.dirname(fdPath))) {
                fs.mkdirSync(path.dirname(fdPath));
            }
            fdError = fs.createWriteStream(fdPath, {
                flags: 'a+',
                encoding: 'utf8'
            });
        } catch (e) {}
    }

    console.info = console.log = function() {
        fd.write(util.format.apply(this, arguments) + '\n');
    };

    console.error = console.warn = function() {
        if (!fdError) {
            fd.write(util.format.apply(this, arguments) + '\n');
        } else {
            fdError.write(util.format.apply(this, arguments) + '\n');
        }
    };

    console.dir = function(object) {
        fd.write(util.inspect(object) + '\n');
    };

    if (program.debug) {
        console.debug = function () {
            fd.write(util.format.apply(this, arguments) + '\n');
        };
    } else {
        console.debug = function(){};
    }
}

module.exports = new Logger();

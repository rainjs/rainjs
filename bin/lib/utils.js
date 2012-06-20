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

var path = require('path'),
    fs = require('fs');

var root = path.resolve(__dirname, '..', '..');

/**
 * Utility method that starts the server
 *
 * @param {Object} options the server startup options
 */
function startServer(options) {
    try {
        var projectRoot = getProjectRoot(options.parent.dir);
    } catch (e) {
        console.log(options.parent.dir, 'is not located inside a valid rain project.');
        process.exit(1);
    }

    var pidFile = path.join(projectRoot, '.server');

    if (options.debug && 'win32' != process.platform) {
        process.kill(process.pid, 'SIGUSR1');
    }

    fs.writeFileSync(pidFile, process.pid);
    process.on('SIGTERM', function () {
        fs.truncateSync(fs.openSync(pidFile, 'w+'), 0);
        process.exit();
    });

    process.chdir(projectRoot);
    require(path.join(root, 'lib', 'server')).initialize();
}

/**
 * Log a message to the console.
 */
function log() {
    var lines = [''];
    for (var str in arguments){
        lines.push(arguments[str]);
    }
    console.log(lines.join('\n'));
}

/**
 * Gets the project root by doing a bottom up search from a directory recived as a parameter
 *
 * @param {String} cwd the directory to start searching from
 * @returns {String} the project root path
 * @throws {Error} if it reaches /
 */
function getProjectRoot(cwd) {
    return (function getRoot(dir) {
        if ('/' == dir) {
            throw new Error('The specified path is not a rain project.');
        }

        try {
            fs.statSync(path.join(dir, '.rain'));
            return dir;
        } catch (e) {
            return getRoot(path.dirname(dir));
        }
    })(cwd);
}

module.exports = {
    startServer: startServer,
    log: log,
    getProjectRoot: getProjectRoot
};

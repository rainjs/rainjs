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

/**
 * Gets the project root by doing a bottom up search from a directory received as a parameter.
 * This works by recursively going up the directory hierarchy until it reaches root (/) at which time
 * it stops and throws an error.
 *
 * @param {String} cwd the directory to start searching from
 * @returns {String} the project root path
 * @throws {Error} if it reaches /
 */
function getProjectRoot(cwd) {
    cwd = path.resolve(cwd);
    while ('/' !== cwd && !/^[A-Za-z]:\\$/.test(cwd)) {
        if (!fs.existsSync(path.join(cwd, '.rain'))) {
            cwd = path.dirname(cwd);
            continue;
        }

        return cwd;
    }

    throw new Error('The specified path is not a RAIN project.');
}

function iterateComponents(componentsFolder, callback) {
    var folders = fs.readdirSync(componentsFolder);

    for (var i = 0, len = folders.length; i < len; i++) {
        var componentPath = path.join(componentsFolder, folders[i]),
            metaFile = path.join(componentPath, 'meta.json');

        if (!fs.statSync(componentPath).isDirectory()) {
            continue;
        }

        var config = null;
        try {
            config = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
        } catch (ex) {
            //parsing errors are ignored
        }

        if (config) {
            callback(config, componentPath, folders[i]);
        }
    }
}

module.exports = {
    getProjectRoot: getProjectRoot,
    iterateComponents: iterateComponents
};

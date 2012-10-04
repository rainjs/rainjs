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

var fs = require('fs');
var path = require('path');
var util = require('util');

/**
 * Recursively walks a folder and calls a callback for every file
 * encountered. Silently ignores errors.
 *
 * @param {String} folder
 * @param {Array} [extensions] array of extensions (including the leading .) for which the callback should be called
 * @param {Function} callback
 */
util.walkSync = function (folder, extensions, callback, excludes) {
    if (arguments.length < 2) {
        return;
    }

    // identify arguments
    if (typeof extensions === 'function') {
        callback = extensions;
        extensions = [];
    }

    if (typeof excludes === 'undefined') {
        excludes = ['.svn', '_svn', '.git'];
    }

    (function walk(folder) {
        try {
            var files = fs.readdirSync(folder);
        } catch (e) {
            // ignore errors
            return;
        }

        for (var i = files.length; i--;) {
            var file = files[i];

            if (excludes.indexOf(file) !== -1) {
                console.log('excluding:', path.join(folder, file));
                continue;
            }

            var file = path.join(folder, file);

            try {
                var stat = fs.statSync(file);
            } catch (e) {
                // ignore errors
                return;
            }

            if (stat.isDirectory()) {
                walk(file);
            } else if (extensions.length === 0
                    || ~extensions.indexOf(path.extname(file))) {
                callback(file, folder);
            }
        }
    })(folder);
};

module.exports = util;

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
util.walkSync = function (folder, extensions, callback) {
    if (arguments.length < 2) {
        return;
    }

    // identify arguments
    if (typeof extensions === 'function') {
        callback = extensions;
        extensions = [];
    }

    (function walk(folder) {
        try {
            var files = fs.readdirSync(folder);
        } catch (e) {
            // ignore errors
            return;
        }

        for (var i = files.length; i--;) {
            var file = path.join(folder, files[i]);

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
                callback(file);
            }
        };
    })(folder);
};

module.exports = util;

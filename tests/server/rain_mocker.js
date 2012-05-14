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

var cache = {};
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var extend = require('node.extend');

/**
 * The function loads a module from a path into a new context. It can give access to
 * private functions and uses supplied mocked modules by wrapping the require function.
 *
 * @param {String} file the file path
 * @param {Object} [descriptor] if the descriptor does not have the ``context`` and ``mocks`` keys then it is used directly as the mocked modules
 * @param {Object} [descriptor.context] additional object that will be added to the new context
 * @param {Object} [descriptor.mocks] the mocked modules
 * @param {Boolean} all true if all the context should be returned, otherwise only the module's exports.
 * @returns {Object} the original exports from the loaded module
 */
module.exports = function (file, descriptor, all) {
    // The module-level context the file will run under.
    var context;

    descriptor = descriptor || {};

    // Copy the current global properties into the new context.
    context = extend(extend, global);

    // Don't load any file more than once. module.exports should be blank ready for exporting.
    context.module = {
        exports : {}
    };

    // Include the exports variable, so user can use this as an alternative to module.exports.
    context.exports = context.module.exports;

    // Include timer variables.
    context.setTimeout = setTimeout;
    context.clearTimeout = clearTimeout;
    context.setInterval = setInterval;
    context.clearInterval = clearInterval;

    // Include other globals, which also helps with errors.
    context.console = console;
    context.process = process;

    // Sort out the __filename and __dirname.
    context.__filename = path.resolve(file);
    context.__dirname = path.dirname(context.__filename);

    // The mock objects.
    var mocks;

    if (descriptor.context || descriptor.mocks) {
        for (var key in descriptor.context) {
            if (descriptor.context.hasOwnProperty(key)) {
                context[key] = descriptor.context[key];
            }
        }
        mocks = descriptor.mocks || {};
    } else {
        mocks = descriptor || {};
    }

    // Set a wrapper for require. If the user has given a mock, use that.
    context.require = function (lib) {
        if (mocks.hasOwnProperty(lib)) {
            return mocks[lib];
        }
        if (lib.indexOf('./') === 0 || lib.indexOf('../') === 0) {
            return require(path.resolve(path.join(path.dirname(file), lib)));
        }
        return require(lib);
    };

    // This means the user can use include in setup, because it's nice and quick.
    if (!cache[file]) {
        // Use sync version because `require` is sync, so that's what the user expects.
        var data = fs.readFileSync(file, 'utf8');
        cache[file] = vm.createScript(data, file);
    }

    // Run the included file.
    cache[file].runInNewContext(context);

    if (all) {
        return context;
    }
    return context.module.exports;
};

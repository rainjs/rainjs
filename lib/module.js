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

var extend = require('node.extend'),
    fs = require('fs'),
    vm = require('vm'),
    path = require('path'),
    Module = require('module');

var scripts = {};

/**
 * Load a module that will run in a sandboxed context without any access to outside code
 *
 * @param {String} file the module to load
 * @param {Object} context the context that will be attached
 * @returns {Object} the exported module
 */
global.requireWithContext = function requireWithContext(file, context) {
    context = context || {};

    var filename = Module._resolveFilename(file, this),
        cachedScript = scripts[filename];

    if (!cachedScript) {
        var content = fs.readFileSync(filename, 'utf8');
        content = content.replace(/^#!.*/, ''); // strip shebang
        cachedScript = vm.createScript(content, filename);
        scripts[filename] = cachedScript;
    }

    var mod = new Module(filename);
    mod.filename = filename;
    mod.paths = Module._nodeModulePaths(path.dirname(filename));
    mod.extension = path.extname(filename) || '.js';

    var sandbox = {};
    sandbox.__filename = filename;
    sandbox.__dirname = path.dirname(filename);
    sandbox.module = mod;
    sandbox.exports = mod.exports;
    sandbox.require = mod.require.bind(mod);
    sandbox.global = {};
    extend(sandbox, global);
    extend(sandbox.global, context);
    extend(sandbox, context);

    cachedScript.runInNewContext(sandbox);
    mod.loaded = true;

    return mod.exports;
};

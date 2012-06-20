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

var cwd = process.cwd();
var path = require('path');
var globals = require(cwd + '/lib/globals.js');
var logger = require(cwd + '/lib/logger.js');
var configuration = require(cwd + '/lib/configuration.js');

var util = require(cwd + '/lib/util.js');

describe('Util module', function () {

    var mockComponentRegistry, componentRegistry;
    mockComponentRegistry = loadModuleContext('/lib/component_registry.js');
    mockComponentRegistry.registerConfigComponents();
    componentRegistry = new mockComponentRegistry.ComponentRegistry();

    var config = componentRegistry.getConfig('button', '1.0');
    var folder = config.folder;

    it('must call the callback for all files', function () {
        var files = [];
        util.walkSync(folder, [], function (file) {
            files.push(file);
        });
        expect(files.length).toBe(8);
    });

    it('must call the callback only for a set of files', function () {
        var files = [];
        util.walkSync(folder, ['.css'], function (file) {
            files.push(file);
        });
        expect(files.length).toBe(1);
        expect(files[0]).toBe(path.join(config.paths('css', true), 'index.css'));

        files = [];
        util.walkSync(folder, ['.css', '.json', '.html'], function (file) {
            files.push(file);
        });
        expect(files.length).toBe(4);
    });
});

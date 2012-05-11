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
var globals = require(cwd + '/lib/globals');
var loadFile = require(cwd + '/tests/server/rain_mocker');
var pluginFolder = path.join(cwd, '/lib/handlebars/');

describe('Handlebars configuration', function () {
    var plugins;

    beforeEach(function () {
        spyOn(console, 'log').andCallFake(function () {});

        plugins = {};
        var mocks = {
            'handlebars': {
                registerHelper: function (name, helper) {
                    plugins[name] = helper;
                }
            }
        };

        // Mock the loading of the Handlebars helpers. The helpers are mocked because
        // they have some dependencies that are not so easy to mock.
        mocks[path.join(pluginFolder, 'css.js')] = {
            name: 'css',
            helper: function () {}
        };
        mocks[path.join(pluginFolder, 'component.js')] = {
            name: 'component',
            helper: function () {}
        };
        mocks[path.join(pluginFolder, 'translation.js')] = {
            name: 't',
            helper: function () {}
        };
        mocks[path.join(pluginFolder, 'translation_plural.js')] = {
            name: 'nt',
            helper: function () {}
        };

        loadFile(cwd + '/lib/handlebars.js', mocks, true);
    });

    it('must register all Handlebars plugins', function () {
        expect(typeof plugins['css'] === 'function').toBe(true);
        expect(typeof plugins['component'] === 'function').toBe(true);
        expect(typeof plugins['t'] === 'function').toBe(true);
        expect(typeof plugins['nt'] === 'function').toBe(true);
    });

});

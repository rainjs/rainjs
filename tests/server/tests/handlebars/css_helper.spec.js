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
var globals = require(cwd + '/lib/globals.js');
var config = require(cwd + '/lib/configuration');
var loadFile = require(cwd + '/tests/server/rain_mocker');

describe('Handlebars css helper', function () {
    var cssHelper, Handlebars, mockComponentRegistry, componentRegistry, rainContext;

    beforeEach(function () {
        mockComponentRegistry = loadFile(process.cwd() + '/lib/component_registry.js', null, true);
        mockComponentRegistry.scanComponentFolder();
        componentRegistry = new mockComponentRegistry.ComponentRegistry();
        rainContext = {
            css: [],
            component: {
                id: 'example',
                version: '1.0'
            }
        };

        cssHelper = loadFile(cwd + '/lib/handlebars/css.js', {
            '../component_registry': componentRegistry,
            '../renderer': {
                rain: rainContext
            }
        });
        Handlebars = require('handlebars');

        Handlebars.registerHelper(cssHelper.name, cssHelper.helper);
    });

    describe('register plugin to handlebars', function () {
        it('must register the css helper to handlebars', function () {
            expect(cssHelper.name).toEqual('css');
            expect(typeof cssHelper.helper).toEqual('function');
        });
    });

    describe('test required and optional options', function () {
        it('must throw error if path is missing', function () {
            var template = Handlebars.compile('{{css version="1.0"}}');
            expect(function() {
                template();
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'css');
        });

        it('must create correct css dependencies for the same component', function () {
            Handlebars.compile('{{css path="index.css"}}')();
            expect(rainContext.css.length).toEqual(1);
            expect(rainContext.css[0]).toEqual('/example/1.0/css/index.css');
        });

        it('must throw error if the version is specified but the component is not', function () {
            var template = Handlebars.compile('{{css path="index.css" version="2.4"}}');
            expect(function() {
                template();
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'name missing');
        });

        it('must create correct dependency css with latest version', function() {
            Handlebars.compile('{{css name="example" path="index.css"}}')();
            expect(rainContext.css[0]).toEqual('/example/4.5.2/css/index.css?component=example&version=1.0');
        });

        it('must create correct css dependency for external components', function() {
            // Test external resource with latest version.
            Handlebars.compile('{{css name="error" path="index.css"}}')();
            expect(rainContext.css[0]).toEqual('/error/1.0/css/index.css?component=example&version=1.0');

            // Test external resource with given version.
            Handlebars.compile('{{css name="example" version="1.3.5" path="index.css"}}')();
            expect(rainContext.css[1]).toEqual('/example/1.3.5/css/index.css?component=example&version=1.0');
        });
    });
});

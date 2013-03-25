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
var config = require(cwd + '/lib/configuration.js');
var routerUtils = require(cwd + '/lib/router_utils');

var http = require('mocks').http;

describe('Router Plugin: CSS Route', function () {
    var mockComponentRegistry = null;
    var componentRegistry = null;
    var routerPlugin = null;
    var response = null;
    var request = null;

    beforeEach(function() {
        response = new http.ServerResponse();
        request = new http.ServerRequest();
        mockComponentRegistry = loadModuleContext('/lib/component_registry.js');
        mockComponentRegistry.registerConfigComponents();

        componentRegistry = new mockComponentRegistry.ComponentRegistry();

        componentRegistry.getConfig('button', '1.0').compiledCSS = {
            'index.css': {
                unscopedCSS: '.other { color: red; } ',
                content: '.button_1_0 .other { color: red; } '
            }
        };

        routerPlugin = loadModuleExports('/lib/routes/css.js', {
            "../router_utils": {
                handleError: function (error, request, response) {
                    response._body = 'error|' + error.message + '|' + error.code;
                },
                refuseNonGetRequests: function () {
                    return false;
                },
                handleNotFound: function (request, response) {
                    var error = new RainError('The specified URL was not found!',
                                              RainError.ERROR_HTTP, 404);
                    this.handleError(error, request, response);
                },
                setResourceHeaders: function () {
                    return {
                        sendBody: true
                    };
                }
            },
            '../component_registry': componentRegistry
        });
    });

    it('must return 404 if the compiled css is not found', function () {
        request.method = 'get';
        request.path = 'index2.css';
        request.component = componentRegistry.getConfig('button', '1.0');
        routerPlugin.handle(request, response);
        expect(response._body).toEqual('error|The specified URL was not found!|404');
    });

    it('must return 404 if the scope component is specified and invalid', function () {
        request.query = {
            component: 'button',
            version: '3.0'
        };
        request.method = 'get';
        request.path = 'index.css';
        request.component = componentRegistry.getConfig('button', '1.0');
        routerPlugin.handle(request, response);
        expect(response._body).toEqual('error|The specified URL was not found!|404');
    });

    it('must server the cached css for current component', function () {
        runs(function () {
            request.method = 'get';
            request.path = 'index.css';
            request.component = componentRegistry.getConfig('button', '1.0');
            routerPlugin.handle(request, response);
        });

        runs(function() {
            expect(response._body.replace(/\s+/g, ' '))
                   .toEqual(request.component.compiledCSS[request.path].content);
        });
    });

    it('must scope the css with the requested component for cross referencing', function () {
        runs(function () {
            request.query = {
                component: 'button',
                version: '2.0'
            };
            request.method = 'get';
            request.path = 'index.css';
            request.component = componentRegistry.getConfig('button', '1.0');
            routerPlugin.handle(request, response);
        });

        runs(function() {
            expect(response._body.replace(/\s+/g, ' ')).toEqual('.button_2_0 ' + 
                    request.component.compiledCSS[request.path].unscopedCSS);
        });
    });
});

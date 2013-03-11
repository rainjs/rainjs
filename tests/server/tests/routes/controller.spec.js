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
var http = require('mocks').http;

describe('Router Plugin: Controller', function() {

    var mockComponentRegistry, componentRegistry;
    var response, request;
    var Spy, Mocks, routerPlugin;

    beforeEach(function() {
        Spy = {};

        Spy.Logging = jasmine.createSpyObj('Spy.Logging', ['get']);
        Spy.Logger = jasmine.createSpyObj('logger', ['debug', 'info', 'warn', 'error', 'fatal']);
        Spy.Logging.get.andReturn(Spy.Logger);

        Spy.RouterUtils = jasmine.createSpyObj('Spy.RouterUtils', ['handleError']);
        Spy.RouterUtils.handleError.andCallFake(
                function (error, request, response) {
                    response._body = "error|" + error.message + "|" + error.code;
                });

        Mocks = {
            '../logging': Spy.Logging,
            '../router_utils': Spy.RouterUtils
        };

        routerPlugin = loadModuleExports('/lib/routes/controller.js', Mocks);

        response = new http.ServerResponse();
        request = new http.ServerRequest();
        request.environment = {
                language: 'EN_us'
        };
        mockComponentRegistry = loadModuleContext('/lib/component_registry.js');
        mockComponentRegistry.registerConfigComponents();
        componentRegistry = new mockComponentRegistry.ComponentRegistry();
    });

    it('must call the server side controller and give an anwser back', function() {
        request.method = "get";
        request.path = "level2";
        request.component = componentRegistry.getConfig("example", "0.0.1");
        routerPlugin.handle(request, response);
        expect(response._body).toEqual("finished");
        response.finished = true;
    });

    /**
     * In this use case is no server script defined in the meta.json
     * but the js file exists with the viewID as name
     */
    it('must call the server side controller and give an anwser back (default fallback)', function() {
        request.method = "get";
        request.path = "index";
        request.component = componentRegistry.getConfig("example", "0.0.1");
        routerPlugin.handle(request, response);
        expect(response._body).toEqual("finished");
        response.finished = true;
    });

    it('must call an error cause there is no specified controller', function() {
        request.method = "get";
        request.path = "level3";
        request.component = componentRegistry.getConfig("example", "0.0.1");
        routerPlugin.handle(request, response);
        expect(response._body).toEqual("error|The specified controller was not found!|404");
        response.finished = true;
    });

    it('must call an error cause the controller is not anwsering for the given timeout', function() {
        runs(function(){
            request.method = "post";
            request.path = "index";
            request.component = componentRegistry.getConfig("example", "0.0.1");
            routerPlugin.handle(request, response);
        });

        waitsFor(function(){
            if(response._body != null){
                return true;
            }
        });

        runs(function(){
            expect(response._body).toEqual("error|The controller method timed out|504");
        });
    });

    it('should return an error for containers', function () {
        request.method = 'GET';
        request.path = 'index';
        request.component = componentRegistry.getConfig('container', '1.0');

        routerPlugin.handle(request, response);

        expect(Spy.Logger.warn).toHaveBeenCalled();
        expect(Spy.RouterUtils.handleError.mostRecentCall.args[0] instanceof RainError).toEqual(true);
    });
});

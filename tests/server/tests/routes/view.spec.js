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

describe('Router Plugin: View handler', function() {
    var mockComponentRegistry = null,
        componentRegistry = null,
        response,
        request = {},
        mocks = {},
        renderBootstrap, renderer, config, routerPlugin,
        loginComponentId, loginVersion, loginViewId;

    beforeEach(function() {

        renderer = jasmine.createSpyObj('renderer', ['renderBootstrap']);
        renderer.renderBootstrap.andCallFake(function (component, viewId, request, response) {
            return "bootstrap with "+component.id+" "+component.version+" "+viewId;
        });
        mocks['../renderer'] = renderer;

        var config = {
            "loginComponent": {
                "id": "user",
                "version": "1.0",
                "viewId": "login"
            }
        };

        mocks['../configuration'] = config;

        loginComponentId = config.loginComponent.id,
        loginVersion = config.loginComponent.version,
        loginViewId = config.loginComponent.viewId;

        routerPlugin = loadModuleExports('/lib/routes/view.js', mocks);


        response = jasmine.createSpyObj('response', ['write', 'setHeader', 'writeHead', 'end']);

        request.user = {
            _isAuthenticated: false
        };

        mockComponentRegistry = loadModuleContext('/lib/component_registry.js');
        mockComponentRegistry.registerConfigComponents();
        componentRegistry = new mockComponentRegistry.ComponentRegistry();
        response.write.andCallFake(function (text) {
            if(!this._body){
                this._body = "";
            }
            this._body += text;
            this.finished = true;
        });
    });

    it('must return the bootstrap html', function() {
        request.path = "index";
        request.component = componentRegistry.getConfig("example", "0.0.1");
        routerPlugin.handle(request, response);
        expect(response._body).toEqual("bootstrap with example 0.0.1 index");
        expect(response.finished).toBe(true);
    });

    it('must redirect to login component if authentication is needed for the requested component',
            function () {

        request.component = {
            id: 'fakeId',
            version: '1.0',
            permissions: ['somePermission'],
            views: {
                index: {}
            }
        };
        request.path = "index";
        var loginRoute = '/' + loginComponentId + '/' + loginVersion + '/' + loginViewId;

        routerPlugin.handle(request, response);
        expect(response._body).toBe(undefined);
        expect(response.writeHead).toHaveBeenCalledWith(302, {
            'Location': loginRoute
        });
        expect(response.end).toHaveBeenCalled();

    });

    it('must redirect to login component if authentication is needed for the requested view', function () {
        request.component = {
            id: 'fakeId',
            version: '1.0',
            views: {
                index: {
                    permissions: ['somePermission']
                }
            }
        };
        request.path = "index";
        var loginRoute = '/' + loginComponentId + '/' + loginVersion + '/' + loginViewId;

        routerPlugin.handle(request, response);
        expect(response._body).toBe(undefined);
        expect(response.writeHead).toHaveBeenCalledWith(302, {
            'Location': loginRoute
        });
        expect(response.end).toHaveBeenCalled();
    });

    it('must not redirect the user if he is authenticated when he requires a component' +
        ' that needs authentication', function () {

        request.user._isAuthenticated = true;

        request.component = {
            id: 'fakeId',
            version: '1.0',
            views: {
                index: {
                    permissions: ['somePermission']
                }
            }
        };
        request.path = "index";
        var loginRoute = '/' + loginComponentId + '/' + loginVersion + '/' + loginViewId;

        routerPlugin.handle(request, response);
        expect(response._body).toBe('bootstrap with fakeId 1.0 index');
        expect(response.finished).toBe(true);
    });
});

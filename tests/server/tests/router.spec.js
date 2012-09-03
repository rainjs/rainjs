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

var cwd = process.cwd(),
    Module = require('module'),
    path = require('path'),
    router,
    request, response;

var routesFolder = path.join(__dirname, 'routes');

var routes = {
    'controller': {
        name: "Controller Route",
        route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:controller)\/(.+)/,
        handle: function (req, res) {},
        url: '/button/1.0/controller/index'
    },
    'css': {
        name: "CSS Route",
        route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:css)\/(.+)/,
        handle: function (req, res) {},
        url: '/button/1.0/css/index.css'
    },
    'javascript': {
        name: "Javascript Route",
        route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:js)\/(.+)/,
        handle: function (req, res) {},
        url: '/button/1.0/js/index.js'
    },
    'resource': {
        name: "Resource Route",
        route: /^\/([\w-]+)\/(?:((?:\d\.)?\d\.\d)\/)?(?:([a-z]{2}_[A-Z]{2})\/)?resources\/(.+)/,
        handle: function (req, res) {},
        url: '/button/1.0/resources/image.png'
    },
    'view': {
        name: "View Route",
        route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(.+)$/,
        handle: function (req, res) {},
        url: '/button/1.0/index'
    }
};

var componentMap = {
    button: {
         config: {
             '1.0': {
                 id: 'button',
                 version: '1.0',
                 folder: '/components/button'
             }
         }
    }
};

function expectNextToBeCalled(url, code, message) {
    var next = jasmine.createSpy('next');
    request.url = url;
    router(request, response, next);
    expect(next).toHaveBeenCalled();
    var error = next.mostRecentCall.args[0];
    expect(error.code).toBe(code);
    expect(error.message).toBe(message);
}

describe('Router', function () {
    beforeEach(function () {
        request = {};
        response = {};

        spyOn(Module.prototype, 'require').andCallFake(function (module) {
            if (module === './component_registry') {
                return {
                    getConfig: function (id, version) {
                        if (!componentMap[id] || !componentMap[id].config[version]) {
                            return;
                        }
                        return componentMap[id].config[version];
                    },
                    getLatestVersion: function (id) {
                        if (id === 'button'){
                            return '1.0';
                        }
                        return;
                    }
                };
            }

            var basename = path.basename(module);
            if (routes.hasOwnProperty(basename)) {
                return routes[basename];
            }

            return Module._load(module, this);
        });

        for (var key in routes) {
            spyOn(routes[key], 'handle').andCallThrough();
        }

        router = require(cwd + '/lib/router')();
    });

    it('should match the correct route', function () {
        for (var key in routes) {
            var route = routes[key];
            var next = jasmine.createSpy('next');
            request.url = route.url;
            router(request, response, next);
            expect(route).toBe(request.rainRoute);
        }
    });

    it('should call next with a 404 error if the component was not found', function () {
        expectNextToBeCalled('/button1/1.0/index', 404, 'The requested component was not found!');
    });

    it('should call next with a 404 error if no route was found', function () {
        expectNextToBeCalled('/invalid', 404, 'No route was found!');
    });

    it('should call next with a 404 error if the url is not valid', function () {
        expectNextToBeCalled('/button/1.0/js/../index', 404, 'The url is not valid!');
        expectNextToBeCalled('/button/1.0/js/%2E%2E/index', 404, 'The url is not valid!');
    });

    it('should set the resource language in the request', function () {
        var next = jasmine.createSpy('next');
        request.url = '/button/1.0/ro_RO/resources/image.png';
        router(request, response, next);
        expect(request.resourceLanguage).toBe('ro_RO');
    });
});

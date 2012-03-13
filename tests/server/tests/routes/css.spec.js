"use strict";

var cwd = process.cwd();
var globals = require(cwd + '/lib/globals.js');
var config = require(cwd + '/lib/configuration.js');
var loadFile = require(cwd + '/tests/server/rain_mocker');
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
        mockComponentRegistry = loadFile(process.cwd() + '/lib/component_registry.js', null, true);
        mockComponentRegistry.scanComponentFolder();

        componentRegistry = new mockComponentRegistry.ComponentRegistry();

        componentRegistry.getConfig('button', '1.0').compiledCSS = {
            'index.css': {
                content: '.other {color: red;}'
            }
        }

        routerPlugin = loadFile(cwd + '/lib/routes/css.js', {
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

    it('must scope the css with the current component', function () {
        runs(function () {
            request.method = 'get';
            request.path = 'index.css';
            request.component = componentRegistry.getConfig('button', '1.0');
            routerPlugin.handle(request, response);
        });

        waits(100);

        runs(function() {
            expect(response._body.replace(/\s+/g, ' '))
                   .toEqual('.button_1_0 .other { color: red; } ');
        });
    });

    it('must scope the css with the requested component', function () {
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

        waits(100);

        runs(function() {
            expect(response._body.replace(/\s+/g, ' '))
                    .toEqual('.button_2_0 .other { color: red; } ');
        })
    });
});

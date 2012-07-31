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
var Module = require('module');
var renderer, renderUtils;

var button = {
    id: 'button',
    version: '2.0',
    folder: '/components/button2',
    views: {
        index: {
            compiledTemplate: function () {},
            controller: {
                client: 'index.js'
            }
        }
    }
};

var error = {
    id: 'error',
    version: '1.0',
    folder: '/components/button2',
    views: {
        404: {
            compiledTemplate: function () {},
            controller: {
                client: '404.js'
            }
        }
    }
};

var componentMap = {
    placeholder: {
        config: {
            '1.0': {
                id: "placeholder",
                version: "1.0"
            }
        }
    },
    core: {
        config: {
            '1.0': {
                id: "core",
                version: "1.0",
                views: {
                    bootstrap: {
                        compiledTemplate: function () {}
                    }
                }
            }
        }
    }
};

componentMap['button'] = {config: {'2.0': button}};

var bootstrap = componentMap['core'].config['1.0'].views['bootstrap'];
var buttonIndex = button.views['index'];
var error404 = error.views['404'];

var loadingComponent = {
    id: "placeholder",
    version: "1.0",
    viewId: "index",
    timeout: 500
};

var request, response, socket;

var dataLayer = {
    loadData: function () {}
};

var Environment = function () {};
Environment.prototype.language = 'ro_RO';
var environment = new Environment();

var ServerResponse = function () {};
ServerResponse.prototype.write = function () {};
ServerResponse.prototype.end = function () {};
var http = {
        ServerResponse: ServerResponse
};

var Socket = function () {};
Socket.prototype.emit = function () {};
var io = {
    Socket: Socket
};

describe('Renderer', function () {

    beforeEach(function () {

        spyOn(bootstrap, 'compiledTemplate').andCallFake(
            function (context) {
                return '<span>text</span>';
            }
        );

        spyOn(buttonIndex, 'compiledTemplate').andCallFake(
            function (context) {
                return '<div>button</div>';
            }
        );

        spyOn(error404, 'compiledTemplate').andCallFake(
            function (context) {
                return '<div>404</div>';
            }
        );

        spyOn(dataLayer, 'loadData').andCallFake(function () {});
        spyOn(ServerResponse.prototype, 'write').andCallFake(function () {});
        spyOn(ServerResponse.prototype, 'end').andCallFake(function () {});
        spyOn(Socket.prototype, 'emit').andCallFake(function () {});

        spyOn(Module.prototype, 'require').andCallFake(function (path) {
            if (path === './error_handler') {
                return {
                    getErrorComponent: function (statusCode) {
                        return {
                            component: error,
                            view: statusCode
                        };
                    }
                };
            }

            if (path === './component_registry') {
                return {
                    getConfig: function (id, version) {
                        if (!componentMap[id] || !componentMap[id].config[version]) {
                            return;
                        }
                        return componentMap[id].config[version];
                    },
                    getLatestVersion: function (id) {
                        return '1.0';
                    }
                };
            }

            if (path === './configuration') {
                return {
                    loadingComponent: loadingComponent
                };
            }

            if (path === './socket_registry') {
                return {
                    register: function() {}
                };
            }

            if (path === './data_layer') {
                return dataLayer;
            }

            if (path === 'http') {
                return http;
            }

            if (path === 'socket.io') {
                return io;
            }

            if (path === './environment') {
                return Environment;
            }

            return Module._load(path, this);
        });

        request = {
            session: {},
            query: "param=value",
            body: "{}"
        };
        response = new http.ServerResponse();
        socket = new io.Socket();

        renderer = require(cwd + '/lib/renderer');
        renderUtils = require(cwd + '/lib/render_utils');
    });

    describe('renderBootstrap', function () {
        beforeEach(function () {
            delete button.type;
            spyOn(renderer, 'renderComponent').andCallFake(function (opt) {
                return {
                    html: "<div />"
                };
            });
        });

        it('must call the compiled template for the bootstrap', function () {
            renderer.renderBootstrap(button, 'index', request, response);

            expect(bootstrap.compiledTemplate).toHaveBeenCalledWith({
                id: 'button',
                version: '2.0',
                viewId: 'index',
                placeholder: '{"html":"<div />"}',
                placeholderTimeout: 500,
                language: 'ro_RO',
                isContainer: false,
                context: {
                    query: 'param=value',
                    body: '{}'
                }
            });

            button.type = 'container';
            renderer.renderBootstrap(button, 'index', request, response);

            expect(bootstrap.compiledTemplate).toHaveBeenCalledWith({
                id: 'button',
                version: '2.0',
                viewId: 'index',
                placeholder: '{"html":"<div />"}',
                placeholderTimeout: 500,
                language: 'ro_RO',
                isContainer: true,
                context: {
                    query: 'param=value',
                    body: '{}'
                }
            });
        });

        it('must return the bootstrap', function () {
            var html = renderer.renderBootstrap(button, 'index', request, response);
            expect(html).toBe('<span>text</span>');
        });
    });

    describe('renderComponent', function () {

        it('must render the component', function () {
            var rain = renderer.createRainContext({
                component: {},
                transport: response,
                session: request.session
            });

            var opt = {
                component: button,
                viewId: 'index',
                instanceId: 'id',
                parentInstanceId: 'pid',
                context: {
                    key1: 'value1',
                    key2: 'value2'
                },
                rain: rain
            };

            renderer.rain = rain;

            expect(renderer.renderComponent(opt)).toEqual({
                css: [],
                children: [],
                html: '<div>button</div>',
                controller: 'index.js',
                instanceId: 'id',
                containerId: 'pid',
                staticId: '',
                id: 'button',
                version: '2.0',
                error: null
            });

            expect(renderer.rain.component.currentView).toBe('index');
        });

        it('must call the context function', function () {
            var rain = renderer.createRainContext({
                transport: response,
                session: request.session
            });

            var data = 'sample_data';
            var result;
            var opt = {
                component: button,
                viewId: 'index',
                instanceId: 'id',
                context: {
                    data: data
                },
                rain: rain,
                fn: function (context) {
                    result = context.data;
                }
            };

            renderer.renderComponent(opt);

            expect(result).toBe(data);
            expect(opt.context.html).toBeDefined();
        });

        it('must render an error', function () {
            var rain = renderer.createRainContext({
                transport: response,
                session: request.session
            });

            var opt = {
                component: button,
                viewId: 'index1',
                instanceId: 'id',
                context: {
                    key1: 'value1',
                    key2: 'value2'
                },
                rain: rain
            };

            expect(renderer.renderComponent(opt)).toEqual({
                css: [],
                children: [],
                html: '<div>404</div>',
                controller: '404.js',
                instanceId: 'id',
                staticId: '',
                id: 'error',
                version: '1.0',
                error: null
            });
        });
    });

    describe('loadDataAndSend', function () {
        it('must call send component with the correct data', function () {
            spyOn(renderer, 'sendComponent').andCallFake(function (transport, opt) {});

            var comp = {};
            comp.id = 'button';
            comp.version = '2.0';
            comp.view = 'index';
            comp.sid = 'comp1';
            comp.session = request.session;
            comp.environment = environment;
            comp.context = {
                html: 'html'
            };
            comp.parentInstanceId = 'pid';

            renderer.loadDataAndSend(comp, response);

            expect(dataLayer.loadData).toHaveBeenCalled();

            var callback = dataLayer.loadData.mostRecentCall.args[1];

            callback(null, {field: 'data'});

            expect(renderer.sendComponent).toHaveBeenCalledWith(response, {
                component: button,
                viewId: 'index',
                staticId: 'comp1',
                context: {
                    field: 'data',
                    html: 'html'
                },
                parentInstanceId: 'pid',
                rain: {
                    css: [],
                    childrenInstanceIds: [],
                    transport: response,
                    session: request.session,
                    environment: environment
                }
            });
        });
    });

    describe('replaceWithError', function () {
        it('must change the component parameter', function () {
            var component = {id: 'button', version: '1.1', view: 'index'};
            var error = new Error('message');
            renderUtils.replaceWithError(404, component, error);

            expect(component).toEqual({
                id : 'error',
                version : '1.0',
                view : 404,
                context : {
                    error : error
                }
            });
        });
    });

    describe('sendComponent', function () {
        beforeEach(function () {
            spyOn(renderer, 'renderComponent').andCallFake(function () {
                return {
                    html: 'html'
                };
            });
        });

        it('must decrease the render level', function () {
            response.renderLevel = 2;
            renderer.sendComponent(response, {});
            expect(response.renderLevel).toBe(1);
        });

        it('must write the component', function () {
            response.renderLevel = 2;
            renderer.sendComponent(response, {});
            expect(response.write).toHaveBeenCalledWith(
                renderer.clientRendererScript({
                    html: 'html'
                })
            );
        });

        it('must end the connection when render level is 0', function () {
            response.renderLevel = 1;
            renderer.sendComponent(response, {});
            expect(response.end).toHaveBeenCalledWith(
                renderer.clientRendererScript({
                    html: 'html'
                }) + '\n\t</body>\n</html>'
            );
        });

        it('must write the component using web sockets', function () {
            socket.renderLevel = 2;
            renderer.sendComponent(socket, {});
            expect(socket.emit).toHaveBeenCalledWith(
                'render', {html: 'html'}
            );
        });
    });
});

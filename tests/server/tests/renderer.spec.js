"use strict";

var cwd = process.cwd();
var Module = require('module');
var renderer;

var button = {
    id: 'button',
    version: '2.0',
    folder: '/components/button2',
    views: {
        index: {
            compiledTemplate: function() {},
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
            compiledTemplate: function() {},
            controller: {
                client: '404.js'
            }
        }
    }
};

var componentMap = {
    placeholder: {
         config: {
             '1.0': {id: "placeholder", version: "1.0"}
         }
    },
    core: {
        config: {
            '1.0': {id: "core", version: "1.0", views: {bootstrap: { compiledTemplate: function() {} }}}
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
        spyOn(bootstrap, 'compiledTemplate').andCallFake(function (data) { return '<span>text</span>'; });
        spyOn(buttonIndex, 'compiledTemplate').andCallFake(function (data) { return '<div>button</div>'; });
        spyOn(error404, 'compiledTemplate').andCallFake(function (data) { return '<div>404</div>'; });
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
    });

    describe('renderBootstrap', function () {
        beforeEach(function () {
            spyOn(renderer, 'renderComponent').andCallFake(function (opt) { return {html: "<div />"}; });
        });

        it('must call the compiled template for the bootstrap', function () {
            renderer.renderBootstrap(button, 'index', request, response);

            expect(bootstrap.compiledTemplate).toHaveBeenCalledWith({
                id: 'button',
                version: '2.0',
                viewId: 'index',
                placeholder: '{"html":"<div />"}',
                placeholderTimeout: 500,
                data: { query: 'param=value', body: '{}' }
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
                transport: response,
                session: request.session
            });

            var opt = {
                component: button,
                viewId: 'index',
                instanceId: 'id',
                data: { key1: 'value1', key2: 'value2' },
                rain: rain
            };

            expect(renderer.renderComponent(opt)).toEqual({
                css: [],
                children: [],
                html: '<div>button</div>',
                controller: 'index.js',
                instanceId: 'id',
                staticId: '',
                id: 'button',
                version: '2.0',
                error: null
            });
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
                data: { key1: 'value1', key2: 'value2' },
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
            spyOn(renderer, 'sendComponent').andCallFake(function (transport, opt){});

            var comp = {};
            comp.id = 'button';
            comp.version = '2.0';
            comp.view = 'index';
            comp.sid = 'comp1';
            comp.session = request.session;

            renderer.loadDataAndSend(comp, response);

            expect(dataLayer.loadData).toHaveBeenCalled();

            var callback = dataLayer.loadData.mostRecentCall.args[1];

            callback(null, {field: 'data'});

            expect(renderer.sendComponent).toHaveBeenCalledWith(response, {
                component: button,
                viewId: 'index',
                staticId: 'comp1',
                data: { field: 'data' },
                rain: {
                    css: [],
                    childrenInstanceIds: [],
                    transport: response,
                    session: request.session
                }
            });
        });
    });

    describe('replaceWithError', function () {
        it('must change the component parameter', function () {
            var component = {id: 'button', version: '1.1', view: 'index'};
            var error = new Error('message');
            renderer.replaceWithError(404, component, error);

            expect(component).toEqual({
                id : 'error',
                version : '1.0',
                view : 404,
                data : {
                    error : error
                }
            });
        });
    });

    describe('sendComponent', function () {
        beforeEach(function () {
           spyOn(renderer, 'renderComponent').andCallFake(function () { return {html: 'html'}; });
        });

        it('must decrease the render level', function () {
            response.renderLevel = 2;
            renderer.sendComponent(response, {});
            expect(response.renderLevel).toBe(1);
        });

        it('must write the component', function () {
            response.renderLevel = 2;
            renderer.sendComponent(response, {});
            expect(response.write).toHaveBeenCalledWith(renderer.clientRendererScript({html: 'html'}));
        });

        it('must end the connection when render level is 0', function () {
            response.renderLevel = 1;
            renderer.sendComponent(response, {});
            expect(response.end).toHaveBeenCalledWith(renderer.clientRendererScript({html: 'html'}));
        });

        it('must write the component using web sockets', function () {
            socket.renderLevel = 2;
            renderer.sendComponent(socket, {});
            expect(socket.emit).toHaveBeenCalledWith('render', {html: 'html'});
        });
    });
});

"use strict";

var cwd = process.cwd();
var Module = require('module');
var path = require('path');
var router;
var request, response;

var routesFolder = path.join(__dirname, 'routes');

var routes = {
    'controller.js': {
        name: "Controller Route",
        route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:controller)\/(.+)/,
        handle: function (req, res) {},
        url: '/button/1.0/controller/index'
    },
    'css.js': {
        name: "CSS Route",
        route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:css)\/(.+)/,
        handle: function (req, res) {},
        url: '/button/1.0/css/index.css'
    },
    'javascript.js': {
        name: "Javascript Route",
        route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:js)\/(.+)/,
        handle: function (req, res) {},
        url: '/button/1.0/js/index.js'
    },
    'resource.js': {
        name: "Resource Route",
        route: /^\/([\w-]+)\/(?:((?:\d\.)?\d\.\d)\/)?resources\/(.+)/,
        handle: function (req, res) {},
        url: '/button/1.0/resources/image.png'
    },
    'view.js': {
        name: "View Route",
        route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(\w+)$/,
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

describe('Router', function () {
    beforeEach(function () {
        request = {};
        response = {};
        
        spyOn(Module.prototype, 'require').andCallFake(function (module) {
            if (module === 'fs') {
                return {
                    readdirSync: function (folder) {
                        return Object.keys(routes);
                    }
                };
            }
            
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
    
    it('must match the correct route', function () {
        for (var key in routes) {
            var route = routes[key];
            var next = jasmine.createSpy('next');
            request.url = route.url;
            router(request, response, next);
            expect(route.handle).toHaveBeenCalled();
        }
    });
    
    it('must get the component config', function () {        
        var route = routes['view.js'];
        var next = jasmine.createSpy('next');
        request.url = route.url;
        router(request, response, next);
        expect(route.handle).toHaveBeenCalledWith(
            {url: route.url, component: componentMap['button'].config['1.0'], path: 'index'}, {});
    });
    
    it('must call next with a 404 error if the component was not found', function () {
        var next = jasmine.createSpy('next');
        request.url = '/button1/1.0/index';
        router(request, response, next);
        expect(next).toHaveBeenCalled();
        var error = next.mostRecentCall.args[0];
        expect(error.code).toBe(404);
        expect(error.message).toBe('The requested component was not found!');
    });
    
    it('must call next with a 404 error if no route was found', function () {
        var next = jasmine.createSpy('next');
        request.url = '/invalid/button/1.0/index';
        router(request, response, next);
        expect(next).toHaveBeenCalled();
        var error = next.mostRecentCall.args[0];
        expect(error.code).toBe(404);
        expect(error.message).toBe('No route was found!');
    });
    
    it('must call next with a 404 error if the url is not valid', function () {
        var next = jasmine.createSpy('next');
        request.url = '/button/1.0/js/../index';
        router(request, response, next);        
        expect(next).toHaveBeenCalled();
        var error = next.mostRecentCall.args[0];
        expect(error.code).toBe(404);
        expect(error.message).toBe('The url is not valid!');
        
        var next = jasmine.createSpy('next');
        request.url = '/button/1.0/js/%2E%2E/index';
        router(request, response, next);
        expect(next).toHaveBeenCalled();
        var error = next.mostRecentCall.args[0];
        expect(error.code).toBe(404);
        expect(error.message).toBe('The url is not valid!');
    });
});
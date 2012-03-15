"use strict";

var cwd = process.cwd();
var globals = require(process.cwd() + '/lib/globals');
var fs = require('fs');
var loadFile = require(cwd + '/tests/server/rain_mocker');
var http = require('mocks').http;
var connectUtils = require('connect/lib/utils');
var errorComponent = JSON.parse(
    fs.readFileSync(cwd +'/tests/server/fixtures/components/error/meta.json')
);

var routerUtils = loadFile(cwd + '/lib/router_utils.js', {
    './renderer': {
        renderBootstrap: function(component, view, req, res){
            return "bootstrap with "+component.id+" "+component.version+" "+view;
        }
    },
    './error_handler': {
        getErrorComponent: function(statusCode){
            return {
                view: statusCode,
                component: errorComponent
            };
        }
    }
});

describe('Router Utilities', function(){
    var request = null;
    var response = null;

    beforeEach(function () {
        spyOn(console, 'log').andCallFake(function () {});

        response = new http.ServerResponse();
        request = new http.ServerRequest();
        request.destroy = function(){
            this.destroyed = true;
        };
        request.headers = {
            accept: '.......text/html.....'
        };
        response.write = function(text){
            if(!this._body){
                this._body = "";
            }
            this._body += text;
        };
        response.end = function(body){
            if(body){
                this._body = body.toString();
            }
        };
        response.getHeader = function(header){
            return this._headers[header];
        };
    });

    describe('handle error', function () {
        it('must set header to text/html', function () {
            routerUtils.handleError({ code: 400, stack: 'some error'}, request, response);
            expect(response._headers['Content-Type'].indexOf('text/html')).toNotEqual(-1);
            expect(response._body).toEqual("bootstrap with error 1.0 400");
        });

        it('must set header to text/plain', function () {
            request.headers.accept = '.......xml/application.....';
            routerUtils.handleError({ code: 400, stack: 'some error'}, request, response);
            expect(response._headers['Content-Type'].indexOf('text/plain')).toNotEqual(-1);
        });

        it('must set status code to 500 if it is below 400', function () {
            routerUtils.handleError({ code: 304, stack: 'some error'}, request, response);
            expect(response.statusCode).toEqual(500);
            expect(response._body).toEqual("bootstrap with error 1.0 500");
        });

        it('must set status code to 500 if status code is given', function () {
            routerUtils.handleError({ stack: 'some error'}, request, response);
            expect(response.statusCode).toEqual(500);
            expect(response._body).toEqual("bootstrap with error 1.0 500");
        });

        it('must destroy the response if the header was already sent', function () {
            response.headerSent = true;
            routerUtils.handleError({ stack: 'some error'}, request, response);
            expect(request.destroyed).toEqual(true);
        });
    });

    describe('handle not found', function(){
        it('must call handle error handler with 404', function () {
            routerUtils.handleNotFound(request, response);
            expect(response.statusCode).toEqual(404);
            expect(response._body).toEqual("bootstrap with error 1.0 404");
        });
    });

    describe('validate path', function(){
        it('must return valid', function () {
            expect(routerUtils.isValid("/example/resource/images/picture.jpg")).toEqual(true);
        });

        it('must return invalid', function () {
            expect(routerUtils.isValid("/example/resource/images/../../meta.json")).toEqual(false);
        });
    });

    describe('validate resource path', function(){
        it('must return valid', function () {
            expect(
                routerUtils.checkPath(
                    cwd +'/tests/server/fixtures/components/example/resource/',
                    cwd +'/tests/server/fixtures/components/example/resource/images/picture.jpg'
                )).toEqual(true);
        });

        it('must return invalid', function () {
            expect(
                   routerUtils.checkPath(
                       cwd +'/tests/server/fixtures/components/example/resource/',
                       cwd +'/tests/server/fixtures/components/example/resource/images/.hiddenfile.config'
                   )).toEqual(false);
        });
    });

    describe('set resource headers', function(){
        it('must set the headers correctly', function () {
            var maxAge = 150000000;
            var lastModified = new Date();
            var len = 9999;
            routerUtils.setResourceHeaders(request, response, maxAge, new Date(), "text/html", len);
            expect(response._headers['Date']).toBeDefined();
            expect(response._headers['Cache-Control']).toEqual(maxAge);
            expect(response._headers['Last-Modified']).toEqual(lastModified.toUTCString());
            expect(response._headers['Content-Type']).toEqual("text/html");
            expect(response._headers['Accept-Ranges']).toEqual("bytes");
            expect(response._headers['ETag']).toEqual(connectUtils.etag({
                size: len,
                mtime: lastModified
            }));
            expect(response._headers['Content-Length']).toEqual(len);
        });
    });

    describe('handle static resources', function(){
        it('must return the static resource', function () {
            var maxAge = 150000000;
            var type = 'resources';
            request.path = '/placeholder/resources/images/loading.gif';
            request.component = fs.readFileSync(cwd +'/tests/server/fixtures/components/placeholder/meta.json');
            routerUtils.handleStaticResource(request, response, maxAge, type);
        });

        it('must return an error 405 cause the method is not GET OR HEAD', function () {
            var maxAge = 150000000;
            var type = 'resources';
            request.path = '/placeholder/resources/images/loading.giffff';
            request.component = fs.readFileSync(cwd +'/tests/server/fixtures/components/placeholder/meta.json');
            routerUtils.handleStaticResource(request, response, maxAge, type);
            expect(response.statusCode).toEqual(405);
        });

        it('must return an error', function () {
            var mockComponentRegistry = loadFile(process.cwd() + '/lib/component_registry.js', null, true);
            mockComponentRegistry.scanComponentFolder();
            var componentRegistry = new mockComponentRegistry.ComponentRegistry();
            var maxAge = 150000000;
            var type = 'resources';
            request.path = '/images/loading.giffff';
            request.method = 'GET';
            request.component = componentRegistry.getConfig("placeholder", "1.0");


            runs(function(){
                routerUtils.handleStaticResource(request, response, maxAge, type);
            });

            waitsFor(function(){
                if(response.statusCode){
                    return true;
                }
            });

            runs(function(){
                expect(response.statusCode).toEqual(404);
            });
        });

        it('must return the resource', function () {
            var mockComponentRegistry = loadFile(process.cwd() + '/lib/component_registry.js', null, true);
            mockComponentRegistry.scanComponentFolder();
            var componentRegistry = new mockComponentRegistry.ComponentRegistry();
            var maxAge = 150000000;
            var type = 'resources';
            request.path = '/images/loading.gif';
            request.method = 'GET';
            request.component = componentRegistry.getConfig("placeholder", "1.0");

            spyOn(fs, 'createReadStream').andCallFake(function(){
                console.log("spy is on");
                return {
                    destroy: function(){},
                    pipe: function(response){
                        response.statusCode = 200;
                        response.end("received Data");
                    },
                    on: function(){}
                };
            });

            request.on = function(){};
            runs(function(){
                routerUtils.handleStaticResource(request, response, maxAge, type);
            });

            waitsFor(function(){
                if(response.statusCode){
                    return true;
                }
            });

            runs(function(){
                expect(response.statusCode).toEqual(200);
                expect(response._body).toEqual("received Data");
            });
        });
    });
});

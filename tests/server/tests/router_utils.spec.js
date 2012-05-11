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
var path = require('path');
var globals = require(process.cwd() + '/lib/globals');
var fs = require('fs');
var loadFile = require(cwd + '/tests/server/rain_mocker');
var http = require('mocks').http;
var connectUtils = require('connect/lib/utils');
var errorComponent = JSON.parse(
    fs.readFileSync(cwd +'/tests/server/fixtures/components/error/meta.json')
);

var configuration = JSON.parse(
    fs.readFileSync(cwd +'/tests/server/fixtures/server.conf')
);

var routerUtils = loadFile(cwd + '/lib/router_utils.js', {
    './renderer': {
        renderBootstrap: function (component, view, req, res) {
            return "bootstrap with " + component.id + " " + component.version + " " + view;
        }
    },
    './error_handler': {
        getErrorComponent: function (statusCode) {
            return {
                view: statusCode,
                component: errorComponent
            };
        }
    },
    './configuration': configuration
});

describe('Router Utilities', function () {
    var request = null;
    var response = null;

    beforeEach(function () {
        spyOn(console, 'log').andCallFake(function () {});

        response = new http.ServerResponse();
        request = new http.ServerRequest();
        request.destroy = function () {
            this.destroyed = true;
        };
        request.headers = {
            accept: '.......text/html.....'
        };
        response.write = function (text) {
            if (!this._body) {
                this._body = "";
            }
            this._body += text;
        };
        response.end = function (body) {
            if (body) {
                this._body = body.toString();
            }
        };
        response.getHeader = function (header) {
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

    describe('handle not found', function () {
        it('must call handle error handler with 404', function () {
            routerUtils.handleNotFound(request, response);
            expect(response.statusCode).toEqual(404);
            expect(response._body).toEqual("bootstrap with error 1.0 404");
        });
    });

    describe('validate path', function () {
        it('must return valid', function () {
            expect(routerUtils.isValid("/example/resource/images/picture.jpg")).toEqual(true);
        });

        it('must return invalid', function () {
            expect(routerUtils.isValid("/example/resource/images/../../meta.json")).toEqual(false);
        });
    });

    describe('validate resource path', function () {
        it('must return valid', function () {
            expect(
                routerUtils.checkPath(
                    cwd +'/tests/server/fixtures/components/example/resource/',
                    cwd +'/tests/server/fixtures/components/example/resource/images/picture.jpg'
                )).toEqual(true);
        });

        it('must return invalid', function () {
            var result = routerUtils.checkPath(
               cwd +'/tests/server/fixtures/components/example/resource/',
               cwd +'/tests/server/fixtures/components/example/resource/images/.hiddenfile.config'
            );
            expect(result).toEqual(false);
        });
    });

    describe('set resource headers', function () {
        it('must set the headers correctly', function () {
            var maxAge = 150000000;
            var lastModified = new Date();
            var len = 9999;
            routerUtils.setResourceHeaders(request, response, maxAge, new Date(),
                                           "text/html", len);
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

    describe('handle static resources', function () {
        it('must return the static resource', function () {
            var maxAge = 150000000;
            var type = 'resources';
            request.path = '/placeholder/resources/images/loading.gif';
            request.component = fs.readFileSync(cwd +
                                    '/tests/server/fixtures/components/placeholder/meta.json');
            routerUtils.handleStaticResource(request, response, maxAge, type);
        });

        it('must return an error 405 cause the method is not GET OR HEAD', function () {
            var maxAge = 150000000;
            var type = 'resources';
            request.path = '/placeholder/resources/images/loading.giffff';
            request.component = fs.readFileSync(cwd +
                                    '/tests/server/fixtures/components/placeholder/meta.json');
            routerUtils.handleStaticResource(request, response, maxAge, type);
            expect(response.statusCode).toEqual(405);
        });

        it('must return an error', function () {
            var mockComponentRegistry = loadFile(process.cwd() + '/lib/component_registry.js',
                                                 null, true);
            mockComponentRegistry.scanComponentFolder();
            var componentRegistry = new mockComponentRegistry.ComponentRegistry();
            var maxAge = 150000000;
            var type = 'resources';
            request.path = '/images/loading.giffff';
            request.method = 'GET';
            request.component = componentRegistry.getConfig("placeholder", "1.0");

            runs(function () {
                routerUtils.handleStaticResource(request, response, maxAge, type);
            });

            waitsFor(function () {
                if (response.statusCode) {
                    return true;
                }
            });

            runs(function () {
                expect(response.statusCode).toEqual(404);
            });
        });

        it('must return the resource', function () {
            var mockComponentRegistry = loadFile(process.cwd() + '/lib/component_registry.js',
                                                 null, true);
            mockComponentRegistry.scanComponentFolder();
            var componentRegistry = new mockComponentRegistry.ComponentRegistry();
            var maxAge = 150000000;
            var type = 'resources';
            request.path = '/images/loading.gif';
            request.method = 'GET';
            request.component = componentRegistry.getConfig("placeholder", "1.0");

            spyOn(fs, 'createReadStream').andCallFake(function () {
                return {
                    destroy: function () {},
                    pipe: function (response) {
                        response.statusCode = 200;
                        response.end("received Data");
                    },
                    on: function () {}
                };
            });

            request.on = function () {};
            runs(function () {
                routerUtils.handleStaticResource(request, response, maxAge, type);
            });

            waitsFor(function () {
                if (response.statusCode) {
                    return true;
                }
            });

            runs(function () {
                expect(response.statusCode).toEqual(200);
                expect(response._body).toEqual("received Data");
            });
        });

        /**
         * Test the path that is used to read a static resource that's localized.
         * The component used is example;0.0.1
         *
         * @param {String} filePath the file path
         * @param {String} expectedPath the expected path
         * @param {Boolean} notFound true when the file should be missing
         */
        function localize(filePath, expectedPath, notFound) {
            var mockComponentRegistry = loadFile(process.cwd() + '/lib/component_registry.js',
                                                 null, true);
            mockComponentRegistry.scanComponentFolder();
            var componentRegistry = new mockComponentRegistry.ComponentRegistry();
            var maxAge = 150000000;
            var type = 'resources';
            request.query = {
                'loc': undefined
            };
            request.path = filePath;
            request.method = 'GET';
            request.component = componentRegistry.getConfig('example', '0.0.1');

            var localizedResource = undefined;

            spyOn(fs, 'createReadStream').andCallFake(function (resource, opts) {
                localizedResource = resource;
                return {
                    destroy: function () {},
                    pipe: function (response) {
                        response.statusCode = 200;
                        response.end("received Data");
                    },
                    on: function () {}
                };
            });

            request.on = function () {};
            runs(function () {
                routerUtils.handleStaticResource(request, response, maxAge, type);
            });

            waitsFor(function () {
                if (response.statusCode) {
                    return true;
                }
            });

            runs(function () {
                if (notFound) {
                    expect(response.statusCode).toBe(404);
                } else {
                    var resourcesFolder = request.component.paths('resources', true);
                    expect(localizedResource).toBe(path.join(resourcesFolder, expectedPath));
                }
            });
        }

        it('must return the current language localized resource', function () {
            configuration.language = 'de_DE';
            configuration.defaultLanguage = 'en_US';
            localize('/info.txt', 'info_de_DE.txt');
        });

        it('must return the default language localized resource', function () {
            configuration.language = 'en_UK';
            configuration.defaultLanguage = 'ro_RO';
            localize('/info.txt', 'info_ro_RO.txt');
        });

        it('must return the unlocalized resource', function () {
            configuration.language = 'en_US';
            configuration.defaultLanguage = 'en_US';
            localize('/info.txt', 'info.txt');
        });

        it('must return a 404 when the localized resource is not found', function () {
            configuration.language = 'en_US';
            configuration.defaultLanguage = 'en_US';
            localize('/no_file.txt', '', true);
        });
    });
});

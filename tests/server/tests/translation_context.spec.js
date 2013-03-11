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

describe('Translation context', function () {
    var translation, mocks;

    beforeEach(function () {
        mocks = {};

        mocks['../translation'] = translation = jasmine.createSpyObj('translation', ['get']);
        mocks['../environment'] = jasmine.createSpy().andReturn({
            language: 'en_US'
        });
        mocks['../router_utils'] = jasmine.createSpyObj('routerUtils', ['handleError']);
        mocks['../logging'] = mocks['./logging'] = {
            get: function () {
                return jasmine.createSpyObj('logger', ['debug', 'info', 'warn', 'error', 'fatal']);
            }
        };

        var translationSpy = jasmine.createSpyObj('Translation', ['generateContext']);
        translationSpy.generateContext.andReturn({});
        translation.get.andReturn(translationSpy);
        spyOn(global, 'setTimeout');
        spyOn(global, 'requireWithContext');
        requireWithContext.andReturn({
            'get': jasmine.createSpy()
        });
    });

    describe('controller', function () {
        var controller, request, response;

        beforeEach(function () {
            mocks['../configuration'] = {
                server: {
                    timeoutForRequests: 20
                }
            };

            request = {
                component: {
                    views: {
                        someView: {
                            controller: {
                                server: 'someController.js'
                            }
                        }
                    }
                },
                path: 'someView',
                method: 'GET',
                environment: {
                    language: 'en_US'
                }
            };
            response = jasmine.createSpyObj('response', ['end']);
            controller = loadModuleExports('/lib/routes/controller.js', mocks);
        });

        it('should receive the language for the t and nt functions', function () {
            controller.handle(request, response);

            expect(translation.get().generateContext).toHaveBeenCalledWith(request.component, 'en_US');
        });
    });

    describe('data layer', function () {
        var dataLayer, registry, fs, callback;
        var componentOpt = {
            id: 'someComponent',
            viewId: 'someView',
            version: '1.0.0',
            environment: {
                language: 'en_US'
            }
        };
        var component = {
            views: {
                someView: {}
            }
        };

        beforeEach(function () {
            mocks['./component_registry'] = registry = jasmine.createSpyObj('componentRegistry', ['getConfig']);
            mocks['./translation'] = translation;
            mocks['fs'] = fs = jasmine.createSpyObj('fs', ['exists']);
            callback = jasmine.createSpy();

            registry.getConfig.andReturn(component);

            fs.exists.andCallFake(function (path, callback) {
                callback(true, null);
            });

            dataLayer = loadModuleExports('/lib/data_layer.js', mocks);
        });

        it('should receive the language for the t and nt functions', function () {
            dataLayer.loadData(componentOpt, callback);

            expect(callback).toHaveBeenCalled();
            expect(translation.get().generateContext).toHaveBeenCalledWith(component, 'en_US');
        });
    });
});

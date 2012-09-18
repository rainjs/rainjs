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
                method: 'GET'
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

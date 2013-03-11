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
    globals = require(cwd + '/lib/globals.js');

var intent = {
    category: 'com.intents.rain.test',
    action: 'DO_SOMETHING',
    provider: 'some_view'
};

var component = {
    id: 'button',
    version: '2.0',
    views: {
        'some_view': {}
    },
    paths: function () {
        return 'server';
    }
};

var intents = {
    'com.intents.rain.test': {
        DO_SOMETHING: {
            'button_2.0':  {
                type: 'view',
                provider: {
                    component: 'button',
                    version: '2.0',
                    view: 'some_view'
                }
            }
        }
    }
};

var socket;

describe('Intents Registry', function () {
    var intentRegistry, mockedIntentRegistry;
    var socketHandlers = {}, sessionStore, err, session,
        sendComponent, createRainContext, isAuthorized, logFn;

    beforeEach(function () {
        session = {
            a: 1,
            b: 2
        };
        err = null;

        sendComponent = jasmine.createSpy();
        createRainContext = jasmine.createSpy();
        logFn = jasmine.createSpy();
        logFn.andCallFake(function (data, context, cb) {
            cb();
        });

        isAuthorized = false;

        sessionStore = jasmine.createSpyObj('sessionStore', ['get', 'save']);
        sessionStore.get.andDefer(function (defer) {
            defer.resolve(session);
        });
        sessionStore.save.andDefer(function (defer) {
            defer.resolve();
        });

        mockedIntentRegistry = loadModuleContext('/lib/intent_registry.js', {
            './socket_registry': {
                register: function(channel, handler) {
                    socketHandlers[channel] = handler;
                }
            },
            './component_registry': {
                getLatestVersion: function () {},
                getConfig: function () {
                    return component;
                }
            },
            './renderer': {
                sendComponent: sendComponent,
                createRainContext: createRainContext
            },
            './render_utils': {
                isAuthorized: function () {
                    return isAuthorized;
                }
            },
            './server': {
                sessionStore: sessionStore
            },
            './environment': function () {},
            'index.js': {
                log: logFn
            }
        });
        intentRegistry = mockedIntentRegistry.module.exports;
    });

    describe('registration', function () {

        it('should register itself to the socket registry on initialization', function () {
            expect(socketHandlers['/core']).toEqual(mockedIntentRegistry.handleIntent);
        });

        it('should register an intent', function () {
            intentRegistry.register(component, intent);

            expect(mockedIntentRegistry.intents).toEqual(intents);
        });

        it('should throw an error if the intent category is not specified', function () {
            expect(function () {
                intentRegistry.register(component, {
                    action: 'some_action',
                    provider: 'some_provider'
                });
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'category');
        });

        it('should throw an error if the intent action is not specified', function () {
            expect(function () {
                intentRegistry.register(component, {
                    category: 'some_category',
                    provider: 'some_provider'
                });
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'action');
        });

        it('should throw an error if the intent provider is not specified', function () {
            expect(function () {
                intentRegistry.register(component, {
                    action: 'some_action',
                    category: 'some_category'
                });
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'provider');
        });

        it('should throw an error if the intent view does not exist', function () {
            expect(function () {
                intentRegistry.register(component, {
                    category: 'some_category',
                    action: 'some_action',
                    provider: 'inexisting'
                });
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'view');
        });

        it('should throw an error if the intent controller does not exist', function () {
            expect(function () {
                intentRegistry.register(component, {
                    category: 'some_category',
                    action: 'some_action',
                    provider: 'inexisting#log'
                });
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'controller');
        });

        it('should throw an error if the intent provider is not valid', function () {
            expect(function () {
                intentRegistry.register(component, {
                    category: 'some_category',
                    action: 'some_action',
                    provider: 'file#log#invalid'
                });
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'invalid');
        });

        it('should throw an error if the intent is already registered', function () {
            intentRegistry.register(component, intent);
            expect(function () {
                intentRegistry.register(component, intent);
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'registered');

            socketHandlers = {};
        });
    });

    describe('handle intents', function () {

        var fn;

        beforeEach(function () {
            mockedIntentRegistry.intents['com.rain.test'] = {
                LOG_MESSAGE: {
                    'button_2.0':  {
                        type: 'server',
                        provider: {
                            component: 'button',
                            version: '2.0',
                            permissions: ['perm'],
                            controllerPath: 'index.js',
                            method: 'log'
                        }
                    }
                },
                DO_SOMETHING: {
                    'button_2.0':  {
                        type: 'view',
                        provider: {
                            component: 'button',
                            version: '2.0',
                            view: 'some_view'
                        }
                    }
                }
            };

            var callbacks = {};
            socket = {
                on: function (event, callback) {
                    callbacks[event] = callback;
                },
                sessionId: 'sid'
            };

            mockedIntentRegistry.handleIntent(socket);

            fn = callbacks['request_intent'];
        });

        it('should send error message if the intent category is missing', function () {
            var rainError;
            fn({action: 'DO_SOMETHING', context: {}}, function (err) {
                rainError = err;
            });

            expect(rainError.code).toBe('category');
        });

        it('should send error message if the intent action is missing', function () {
            var rainError;
            fn({category: 'com.intents.rain.test', context: {}}, function (err) {
                rainError = err;
            });
            expect(rainError.code).toBe('action');
        });

        it('should send error message if the intent context is missing', function () {
            var rainError;
            fn({category: 'com.intents.rain.test', action: 'DO_SOMETHING'}, function (err) {
                rainError = err;
            });
            expect(rainError.code).toBe('context');
        });

        it('should send error message if the session could not be retrieved', function () {
            err = new RainError('Invalid session');
            var rainError = {};
            session = null;
            var functionCallBack = jasmine.createSpy('fn');
            functionCallBack.andCallFake(function () {
                return rainError.code = 500;
            });
            sessionStore.get.andDefer(function (defer) {
                defer.reject(err);
            });


            fn({
                    category: 'com.rain.test',
                    action: 'LOG_MESSAGE',
                    context: {}
               }, functionCallBack
            );

            waitsFor(function () {
                return functionCallBack.wasCalled;
            });

            runs(function () {
                expect(rainError.code).toBe(500);
            });
        });

        it('should create the rain context and render the component', function () {

            fn({
                    category: 'com.rain.test',
                    action: 'DO_SOMETHING',
                    context: {}
               }
            );

            waitsFor(function () {
                return sendComponent.wasCalled;
            });

            runs(function () {
                expect(createRainContext).toHaveBeenCalledWith({
                    component: undefined,
                    transport: socket,
                    request: {
                        sessionId: 'sid',
                        component: {
                            id: 'button'
                        },
                        sessionStore: sessionStore
                    },
                    session: session,
                    environment: {}
                });
    
                expect(sessionStore.get).toHaveBeenCalled();
                expect(sendComponent.mostRecentCall.args[0]).toBe(socket);
                expect(Object.keys(sendComponent.mostRecentCall.args[1])).toEqual(
                        ['component', 'viewId', 'instanceId', 'context', 'rain']);
            });
        });

        it('should send error message if the intent is not authorized', function () {
            var rainError = {};
            var functionCallBack = jasmine.createSpy('fn');
            functionCallBack.andCallFake(function () {
                rainError.code = 401;
                rainError.type = RainError.ERROR_HTTP;
            });
            fn({category: 'com.rain.test', action: 'LOG_MESSAGE', context: {}}, functionCallBack);

            waitsFor(function () {
                return functionCallBack.wasCalled;
            });

            runs(function () {
                expect(rainError.type).toBe(RainError.ERROR_HTTP);
                expect(rainError.code).toBe(401);
            });
        });

        it('should execute the server-side controller associated with the intent', function () {
            var context = {
                data: 'value'
            };
            var functionCallBack = jasmine.createSpy('fn');
            isAuthorized = true;
            fn({
                    category: 'com.rain.test',
                    action: 'LOG_MESSAGE',
                    context: context
               },
               functionCallBack
            );

            waitsFor(function () {
                return functionCallBack.wasCalled;
            });

            runs(function () {
                expect(logFn.mostRecentCall.args[0]).toEqual(context);
                expect(logFn.mostRecentCall.args[1]).toEqual({
                    session: session
                });
                expect(sessionStore.save).toHaveBeenCalled();
                expect(sessionStore.save.mostRecentCall.args[0]).toEqual(session);
            });
        });
    });
});

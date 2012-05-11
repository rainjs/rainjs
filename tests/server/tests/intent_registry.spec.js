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
var loadFile = require(cwd + '/tests/server/rain_mocker');
var globals = require(cwd + '/lib/globals.js');

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

describe('Intents Registry: ', function () {
    var intentRegistry, mockedIntentRegistry;
    var socketHandlers = {};

    beforeEach(function () {
        mockedIntentRegistry = loadFile(cwd + '/lib/intent_registry.js', {
            mocks: {
                './socket_registry': {
                    register: function(channel, handler) {
                        socketHandlers[channel] = handler;
                    }
                },
                './component_registry': {},
                './renderer': {},
                './render_utils': {
                    isAuthorized: function () {
                        return false;
                    }
                }
            }
        }, true);
        intentRegistry = mockedIntentRegistry.module.exports;
    });

    describe('registration', function () {

        it('must register itself to the socket registry on initialization', function () {
            expect(socketHandlers['/core']).toEqual(mockedIntentRegistry.handleIntent);
        });

        it('must register a intent', function () {
            intentRegistry.register(component, intent);

            expect(mockedIntentRegistry.intents).toEqual(intents);
        });

        it('must throw an error if the intent category is not specified', function () {
            expect(function () {
                intentRegistry.register(component, {
                    action: 'some_action',
                    provider: 'some_provider'
                });
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'category');
        });

        it('must throw an error if the intent action is not specified', function () {
            expect(function () {
                intentRegistry.register(component, {
                    category: 'some_category',
                    provider: 'some_provider'
                });
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'action');
        });

        it('must throw an error if the intent provider is not specified', function () {
            expect(function () {
                intentRegistry.register(component, {
                    action: 'some_action',
                    category: 'some_category'
                });
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'provider');
        });

        it('must throw an error if the intent view does not exist', function () {
            expect(function () {
                intentRegistry.register(component, {
                    category: 'some_category',
                    action: 'some_action',
                    provider: 'inexisting'
                });
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'view');
        });

        it('must throw an error if the intent controller does not exist', function () {
            expect(function () {
                intentRegistry.register(component, {
                    category: 'some_category',
                    action: 'some_action',
                    provider: 'inexisting#log'
                });
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'controller');
        });

        it('must throw an error if the intent provider is not valid', function () {
            expect(function () {
                intentRegistry.register(component, {
                    category: 'some_category',
                    action: 'some_action',
                    provider: 'file#log#invalid'
                });
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'invalid');
        });

        it('must throw an error if the intent is already registered', function () {
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
                }
            };

            var callbacks = {};
            var socket = {
                on: function (event, callback) {
                    callbacks[event] = callback;
                }
            };

            mockedIntentRegistry.handleIntent(socket);

            fn = callbacks['request_intent'];
        });

        it('must send error message if the intent category is missing', function () {
            var rainError;
            fn({action: 'DO_SOMETHING', context: {}}, function (err) {
                rainError = err;
            });

            expect(rainError.type).toBe(RainError.ERROR_PRECONDITION_FAILED, 'category');
        });

        it('must send error message if the intent action is missing', function () {
            var rainError;
            fn({category: 'com.intents.rain.test', context: {}}, function (err) {
                rainError = err;
            });
            expect(rainError.type).toBe(RainError.ERROR_PRECONDITION_FAILED, 'action');
        });

        it('must send error message if the intent context is missing', function () {
            var rainError;
            fn({category: 'com.intents.rain.test', action: 'DO_SOMETHING'}, function (err) {
                rainError = err;
            });
            expect(rainError.type).toBe(RainError.ERROR_PRECONDITION_FAILED, 'context');
        });

        it('must send error message if the intent is not authorized', function () {
            var rainError;
            fn({category: 'com.rain.test', action: 'LOG_MESSAGE', context: {}}, function (err) {
                rainError = err;
            });
            expect(rainError.type).toBe(RainError.ERROR_HTTP);
            expect(rainError.code).toBe(401);
        });
    });
});

"use strict";

var cwd = process.cwd();
var loadFile = require(cwd + '/tests/server/rain_mocker');
var globals = require(cwd + '/lib/globals.js');
var conf = require(cwd + '/lib/configuration');
var util = require('util');

var intent = {
    type: 'view',
    category: 'com.intents.rain.test',
    action: 'DO_SOMETHING',
    view: 'some_view'
};

var component = {
    id: 'button',
    version: '2.0',
    views: {
        'some_view': {}
    },
    paths: function() {return 'server'; }
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
                './renderer': {
                    isAuthorized: function () { return false; }
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
                    type: 'view',
                    view: 'some_provider'
                });
            }).toThrow('You need to specify a category for an intent in component: ' +
                       component.id + ';' + component.version + '.');
        });

        it('must throw an error if the intent action is not specified', function () {
            expect(function () {
                intentRegistry.register(component, {
                    category: 'some_category',
                    type: 'view',
                    view: 'some_provider'
                });
            }).toThrow('You need to specify an action for an intent in component: ' +
                       component.id + ';' + component.version + '.');
        });

        it('must throw an error if the intent view is not specified', function () {
            expect(function () {
                intentRegistry.register(component, {
                    category: 'some_category',
                    action: 'some_action',
                    type: 'view',
                    view: 'inexisting'
                });
            }).toThrow('View inexisting was not found in ' +
                       component.id + ';' + component.version + '.');
        });

        it('must throw an error if the intent is already registered', function () {
            intentRegistry.register(component, intent);
            expect(function () {
                intentRegistry.register(component, intent);
            }).toThrow('Intent ' + intent.category + '.' + intent.action +
                       ' is already registered.');
            socketHandlers = {};
        });
    });

    describe('handle intents', function () {
        var fn;
        var serverIntent = {
            category: "com.rain.test",
            action: "LOG_MESSAGE",
            type: "server",
            controller: "index",
            method: "log"
        };

        beforeEach(function () {
            intentRegistry.register(component, serverIntent);
            
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
            var ack = jasmine.createSpy();
            fn({action: 'DO_SOMETHING', context: {}}, ack);
            expect(ack).toHaveBeenCalledWith('You must specify intent category.');
        });
        
        it('must send error message if the intent action is missing', function () {
            var ack = jasmine.createSpy();
            fn({category: 'com.intents.rain.test', context: {}}, ack);
            expect(ack).toHaveBeenCalledWith('You must specify intent action.');
        });
        
        it('must send error message if the intent context is missing', function () {
            var ack = jasmine.createSpy();
            fn({category: 'com.intents.rain.test', action: 'DO_SOMETHING'}, ack);
            expect(ack).toHaveBeenCalledWith('You must specify intent context');
        });
        
        it('must send error message if the intent is not authorized', function () {
            var ack = jasmine.createSpy();
            fn({category: 'com.rain.test', action: 'LOG_MESSAGE', context: {}}, ack);
            expect(ack).toHaveBeenCalledWith('Unauthorized access to component button!');
        });
    });
});


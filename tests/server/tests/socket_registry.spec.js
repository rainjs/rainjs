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
    Module = require('module'),
    socketRegistry;

var promise = jasmine.createSpyObj('promise', ['resolve', 'reject', 'then']);
var Promise = {
    Deferred: function () {
        return promise;
    }
};

var connect = {
    utils: {
        parseCookie: function () {},
        parseSignedCookies: function () {
            return {
                'rain.sid': 'sid'
            };
        }
    }
};

var session = {
    userLanguage: 'ro_RO'
};

var events = {};
var socket = {
    session: session,
    on: function (eventName, callback) {
        events[eventName] = callback;
    },
    handshake: {
        headers: {
            cookie: undefined
        }
    },
    disconnect: function () {}
};

var sessionStore = jasmine.createSpyObj('sessionStore', ['get', 'set']);

var server = {
    socket: {
        of: function () {
            return socket;
        }
    },
    sessionStore: sessionStore
};

var Translation = {
    get: function () {
        return {
            generateContext: function (component, language) {
                return {component: component,language: language};
            }
        };
    }
};

var component = {
    id: 'example',
    version: '1.0'
};

var websocket;

var Environment = function (session) {
    this.language = session.userLanguage;
};

var dataArgs, errorArgs;

describe('Socket registry', function () {

    beforeEach(function () {
        spyOn(global, 'requireWithContext').andCallFake(function () {
            return websocket;
        });

        var mocks = {
            'promised-io/promise': Promise,
            'connect': connect,
            './server': server,
            './translation': Translation,
            './environment': Environment
        };
        socketRegistry = loadModuleExports('/lib/socket_registry.js', mocks);
    });

    describe('Register', function () {
        beforeEach(function () {
            events = {};
            socket.session = session;
            socket.handshake.headers.cookie = undefined;

            dataArgs = undefined;
            errorArgs = undefined;

            promise.then.andCallFake(function (success, error) {
                if (dataArgs) {
                    success(dataArgs);
                } else {
                    error(errorArgs);
                }
            });

            promise.resolve.andCallFake(function (data) {
                dataArgs = data;
            });

            promise.reject.andCallFake(function (err) {
                errorArgs = err;
            });

            websocket = {
                channel: '/example/1.0',
                handle: function () {}
            };
        });

        it('should listen to certain events', function () {
            socketRegistry.register(websocket.channel, websocket.handle, component);

            expect(events.connection).toBeDefined();
        });

        it('should reject the promise if the session id is missing', function () {
            socketRegistry.register(websocket.channel, websocket.handle, component);
            events.connection(socket);

            expect(promise.reject.mostRecentCall.args[0].type).toBe(RainError.ERROR_SOCKET);
        });

        it('should get the session from the store when the session id is present', function () {
            socket.handshake.headers.cookie = {};

            socketRegistry.register(websocket.channel, websocket.handle, component);
            events.connection(socket);

            expect(sessionStore.get.mostRecentCall.args[0]).toBe('sid');

            var cb = sessionStore.get.mostRecentCall.args[1];

            cb(new RainError('message', RainError.ERROR_NET));
            expect(promise.reject.mostRecentCall.args[0].type).toBe(RainError.ERROR_NET);

            socket.session = undefined;
            cb(null, session);
            expect(promise.resolve.mostRecentCall.args[0]).toEqual(socket);
            expect(socket.session).toEqual(session);
        });

        it('should save the session in the store on disconnect event', function () {
            socket.handshake.headers.cookie = {};

            socketRegistry.register(websocket.channel, websocket.handle, component);
            events.connection(socket);
            events.disconnect(socket);

            expect(sessionStore.set.mostRecentCall.args[0]).toBe('sid');
            expect(sessionStore.set.mostRecentCall.args[1]).toEqual(socket.session);
        });

        it('should call the handler function', function () {
            spyOn(websocket, 'handle').andReturn(true);
            sessionStore.get.andCallFake(function (sid, cb) {
                cb(null, session);
            });

            socket.handshake.headers.cookie = {};

            socketRegistry.register(websocket.channel, websocket.handle, component);
            events.connection(socket);

            expect(websocket.handle).toHaveBeenCalledWith(socket);
        });

        it('should generate the new context with the correct language', function () {
            session.userLanguage = 'de_DE';

            spyOn(websocket, 'handle').andReturn(true);
            sessionStore.get.andCallFake(function (sid, cb) {
                cb(null, session);
            });

            socket.handshake.headers.cookie = {};

            socketRegistry.register(websocket.channel, 'path', component);
            events.connection(socket);

            expect(requireWithContext.mostRecentCall.args[0]).toEqual('path');
            expect(requireWithContext.mostRecentCall.args[1]).toEqual(
                Translation.get().generateContext(component, 'de_DE'));

            expect(websocket.handle).toHaveBeenCalledWith(socket);
        });
    });
});

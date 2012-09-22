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

describe('Socket registry', function () {
    var socketRegistry, mockedSocketRegistry;
    var events, socket, connect, sessionStore, err, session;

    beforeEach(function () {
        events = {};
        socket = {
            on: function (eventName, callback) {
                events[eventName] = callback;
            },
            handshake: {
                headers: {
                    cookie: {}
                }
            },
            disconnect: jasmine.createSpy(),
            emit: jasmine.createSpy()
        };

        connect = {
            utils: {
                parseCookie: function () {},
                parseSignedCookies: function () {
                    return {
                        'rain.sid': 'sid'
                    };
                }
            }
        };

        sessionStore = jasmine.createSpyObj('sessionStore', ['get', 'save']);
        sessionStore.get.andCallFake(function (request, fn) {
            fn(err, session);
        });
        sessionStore.save.andCallFake(function (session, fn) {
            fn && fn();
        });

        mockedSocketRegistry = loadModuleContext('/lib/socket_registry.js', {
            'connect': connect,
            './server': {
                sessionStore: sessionStore,
                socket: {
                    of: function () {
                        return socket;
                    }
                }
            },
            './logging': {
                get: function () {
                    return jasmine.createSpyObj('logger',
                                                ['debug', 'info', 'warn', 'error', 'fatal']);
                }
            }
        });
        socketRegistry = mockedSocketRegistry.module.exports;
    });

    describe('registration', function () {
        it('should register correctly multiple handlers', function () {
            var handler1 = function () {},
                handler2 = function () {};

            socketRegistry.register('/core', handler1, {id: 'core'});
            expect(mockedSocketRegistry.handlers).toEqual({'/core': [handler1]});

            socketRegistry.register('/core', handler2, {id: 'core'});
            expect(mockedSocketRegistry.handlers).toEqual({'/core': [handler1, handler2]});

            socketRegistry.register('/button', handler1, {id: 'button'});
            expect(mockedSocketRegistry.handlers).toEqual({
                '/core': [handler1, handler2],
                '/button': [handler1]
            });
        });
    });

    describe('connection event handler', function () {

        var fn, handler;

        beforeEach(function () {
            err = null;
            session = {
                global: {
                    get: jasmine.createSpy(),
                    set: jasmine.createSpy()
                }
            };
            handler = jasmine.createSpy();

            socketRegistry.register('/core', handler, {id: 'core'});
            fn = events['connection'];
        });

        it('should call the handlers', function () {
            socketRegistry.register('/core', handler, {id: 'button'});
            fn(socket);

            expect(handler).toHaveBeenCalledWith(socket, jasmine.any(Function));
            expect(handler.callCount).toBe(2);
        });

        it('should disconnect the socket if the session id is missing', function () {
            socket.handshake.headers.cookie = undefined;
            fn(socket);

            expect(socket.disconnect).toHaveBeenCalled();
        });

        it('should disconnect the socket if the session couldn\'t be obtained', function () {
            err = {};
            fn(socket);

            expect(socket.disconnect).toHaveBeenCalled();
        });

        it('should get and save the session', function () {
            fn(socket);

            expect(sessionStore.get).toHaveBeenCalled();
            expect(session.id).toBe(mockedSocketRegistry.getSid(socket));
            var cb = handler.mostRecentCall.args[1];

            expect(sessionStore.save).not.toHaveBeenCalled();
            cb();
            expect(sessionStore.save).toHaveBeenCalledWith(session);
        });

        it('should call the handlers when a new event is emitted', function () {
            fn(socket);

            socket.on('message', function () {});
            events['message'](1, 2, 3);

            expect(handler).toHaveBeenCalledWith(socket, jasmine.any(Function));
            expect(sessionStore.get.callCount).toBe(2);
        });
    });
});

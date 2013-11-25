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
    var socketRegistry, mockedSocketRegistry,
        events, socket, connect, sessionStore, authorizationCallback, handshake;

    beforeEach(function () {
        handshake = {
            headers: {
                cookie: {}
            }
        };

        authorizationCallback = jasmine.createSpy('authorizationCallback');
        events = {};
        socket = {
            on: function (eventName, callback) {
                events[eventName] = callback;
            },
            handshake: handshake,
            disconnect: jasmine.createSpy(),
            emit: jasmine.createSpy(),
            authorization: function (fn) {
                fn (handshake, authorizationCallback);
                socket.session = {};
                socket.idp = {
                    updateUser: jasmine.createSpy('updateUser')
                };
                return socket;
            }
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
        sessionStore.get.andDefer(function (defer) {
            var session = {
                get: jasmine.createSpy('get'),
                isDirty: jasmine.createSpy('isDirty'),
                isEmpty: jasmine.createSpy('isEmpty')
            };
            defer.resolve(session);
        });
        sessionStore.save.andDefer(function (defer) {
            defer.resolve();
        });

        mockedSocketRegistry = loadModuleContext('/lib/socket_registry.js', {
            'connect': connect,
            './server': {
                sessionStore: sessionStore,
                globalSessionSync: { wait: function () {} },
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
            handler = jasmine.createSpy();
        });

        it('should call the handlers', function () {
            socketRegistry.register('/core', handler, {id: 'core'});
            fn = events['connection'];
            socketRegistry.register('/core', handler, {id: 'button'});
            waitsFor(function () {
                return authorizationCallback.wasCalled;
            });
            runs(function () {
                fn(socket);

                expect(handler).toHaveBeenCalledWith(socket);
                expect(handler.callCount).toBe(2);
            });
        });

        it('should disconnect the socket if the session id is missing', function () {
            handshake.headers.cookie = null;
            socketRegistry.register('/core', handler, {id: 'button'});

            expect(authorizationCallback).toHaveBeenCalledWith(null, false);
        });

        it('should disconnect the socket if the session couldn\'t be obtained', function () {
            sessionStore.get.andDefer(function (defer) {
                var err = {};
                defer.reject(err);
            });
            socketRegistry.register('/core', handler, {id: 'core'});

            fn = events['connection'];
            waitsFor(function () {
                return authorizationCallback.wasCalled;
            });
            runs(function () {
                expect(authorizationCallback).toHaveBeenCalledWith(jasmine.any(Object), false);
            });
        });

        it('should get and save the session', function () {
            socketRegistry.register('/core', handler, {id: 'core', useSession: true});
            fn = events['connection'];

            waitsFor(function () {
                return authorizationCallback.wasCalled;
            });

            runs(function () {
                fn(socket);
                expect(sessionStore.get).toHaveBeenCalled();
                expect(socket.session.id).toBe('sid');
                expect(sessionStore.save).toHaveBeenCalledWith(socket.session);
            });
        });

        it('should save the session after the promise is resolved', function () {

            socketRegistry.register('/core', handler, {id: 'core', useSession: true});
            fn = events['connection'];

            waitsFor(function () {
                return authorizationCallback.wasCalled;
            });

            runs(function () {
                fn(socket);
                expect(sessionStore.save).toHaveBeenCalledWith(socket.session);
            });
        });

        it('should call the handlers when a new event is emmited and run the ack', function () {
            socketRegistry.register('/core', handler, {id: 'core', useSession: true});
            fn = events['connection'];
            var callFunction = jasmine.createSpy('fn');
            var ack = jasmine.createSpy('ack');
            callFunction.andCallFake(function () {
               return {};
            });

            waitsFor(function () {
                return authorizationCallback.wasCalled;
            });

            runs(function () {
                fn(socket);
                socket.on('message', callFunction);
                events['message'](1, ack);

            });

            waitsFor(function () {
                return callFunction.wasCalled;
            });

            runs(function () {
                expect(handler).toHaveBeenCalledWith(socket);
                expect(ack).toHaveBeenCalled();
            });
        });

        it('should call the handlers and update the user', function () {
            socketRegistry.register('/core', handler, {id: 'core', useSession: true});
            fn = events['connection'];
            var callFunction = jasmine.createSpy('fn');
            var ack = jasmine.createSpy('ack');
            callFunction.andCallFake(function () {
                return {};
            });

            waitsFor(function () {
                return authorizationCallback.wasCalled;
            });

            runs(function () {
                fn(socket);
                handshake.idp = {
                    updateUser: jasmine.createSpy('upUser')
                };
                socket.on('message', callFunction);
                events['message'](1, ack);

            });

            waitsFor(function () {
                return callFunction.wasCalled;
            });

            runs(function () {
                expect(handler).toHaveBeenCalledWith(socket);
                expect(ack).toHaveBeenCalled();
                expect(socket.idp.updateUser).toHaveBeenCalled();
            });
        });

        it('should call the handlers when a new event is emitted', function () {
            socketRegistry.register('/core', handler, {id: 'core', useSession: true});
            fn = events['connection'];
            var callFunction = jasmine.createSpy('fn');

            waitsFor(function () {
                return authorizationCallback.wasCalled;
            });

            runs(function () {
                fn(socket);
                socket.on('message', callFunction);
                events['message'](1, 2, 3);
            });

            waitsFor(function () {
                return callFunction.wasCalled;
            });


            runs(function () {
                expect(handler).toHaveBeenCalledWith(socket);
                //global, component twice
                expect(sessionStore.get.callCount).toBe(3);
            });
        });
    });
});

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

describe('Socket handlers', function () {
    var socketHandlers, mockedSocketHandlers;
    var handlers = {}, sessionStore, err, session, globalSession;

    beforeEach(function () {

        sessionStore = jasmine.createSpyObj('sessionStore', ['get', 'save']);
        sessionStore.get.andDefer(function (defer) {
            defer.resolve();
        });
        sessionStore.save.andDefer(function (defer) {
            defer.resolve();
        });

        mockedSocketHandlers = loadModuleContext('/lib/socket_handlers.js', {
            './socket_registry': {
                register: function (channel, handler) {
                    handlers[channel] = handler;
                }
            },
            './server': {
                sessionStore: sessionStore
            },
            '../logging': {
                get: function () {
                    return jasmine.createSpyObj('logger',
                                                ['debug', 'info', 'warn', 'error', 'fatal']);
                }
            }
        });
        socketHandlers = mockedSocketHandlers.module.exports;
    });

    describe('registration', function () {
        it('should register the change language handler to the socket registry', function () {
            socketHandlers.register();
            expect(handlers['/core']).toEqual(mockedSocketHandlers.changeLanguage);
        });
    });

    describe('change language handler', function () {

        var fn, callbacks = {}, ack,
            socket = {
                on: function (event, callback) {
                    callbacks[event] = callback;
                },
                sessionId: 'sid',
                handshake: {
                    globalSession: {
                        set: jasmine.createSpy()
                    }
                }
            };

        beforeEach(function () {
            err = null;
            session = {
                globalSession: {
                    get: jasmine.createSpy(),
                    set: jasmine.createSpy()
                }
            };

            ack = jasmine.createSpy();

            mockedSocketHandlers.changeLanguage(socket);
            fn = callbacks['change_language'];
        });

        it('should not change the language is the session is missing', function () {
            sessionStore.save.andDefer(function (defer) {
                var err = 'eroare';
                defer.reject(err);
            });
            fn('en_US', ack);

            waitsFor(function () {
                return ack.wasCalled;
            });
            runs(function () {
                expect(sessionStore.save).toHaveBeenCalled();
                expect(ack).toHaveBeenCalledWith('eroare');
            });
        });

        it('should change the user language', function () {
            sessionStore.save.andDefer(function (defer) {
                defer.resolve();
            });
            fn('en_US', ack);

            waitsFor(function () {
                return ack.wasCalled;
            });
            runs(function () {
                expect(socket.handshake.globalSession.set.mostRecentCall.args[0]).toBe('userLanguage');
                expect(socket.handshake.globalSession.set.mostRecentCall.args[1]).toBe('en_US');
                expect(sessionStore.save.mostRecentCall.args[0]).toEqual(socket.handshake.globalSession);
                expect(ack).toHaveBeenCalledWith(undefined);
            });
        });

        it('should throw an error if the new language is incorrect', function () {
            fn('lang', ack);
            expect(ack.mostRecentCall.args[0].type).toBe(RainError.ERROR_PRECONDITION_FAILED);
        });
    });
});

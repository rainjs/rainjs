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

describe('Session', function () {

    var session, mockedSession, options, mocks,
        request, response, next, sessionStore, storeErr, storeSession,
        headerFn, sid, pause, pauseFn;

    beforeEach(function () {
        sessionStore = jasmine.createSpyObj('sessionStore', ['get', 'save', 'createNewSession']);
        sessionStore.get.andCallFake(function (request, fn) {
            fn && fn(storeErr, storeSession);
        });
        sessionStore.save.andCallFake(function (session, fn) {
            fn && fn();
        });
        sessionStore.createNewSession.andCallFake(function (request, next) {
            next();
        });

        options = {
            store: sessionStore
        };

        request = {
            signedCookies: {
                'rain.sid': sid
            },
            headers: {},
            connection: {}
        };

        response = {
            on: function (eventName, callback) {
                headerFn = callback;
            },
            setHeader: jasmine.createSpy(),
            end: jasmine.createSpy()
        };

        next = jasmine.createSpy();

        pause = jasmine.createSpyObj('pause', ['resume']),
        pauseFn = jasmine.createSpy().andCallFake(function () {
            return pause;
        });

        mocks = {
            'connect/lib/utils': {
                pause: pauseFn
            }
        };

        mockedSession = loadModuleContext('/lib/session.js', mocks);
        session = mockedSession.module.exports;
    });

    it('should call the next middleware if the session is found', function () {
        request.session = {};
        session.getHandle(options)(request, response, next);
        expect(next).toHaveBeenCalled();
        expect(request.sessionStore).toBeUndefined();
    });

    it('should call the next middleware if the route doesn\'t need the session', function () {
        request.rainRoute = {
            routeName: 'resource'
        };
        session.getHandle(options)(request, response, next);
        expect(next).toHaveBeenCalled();

        request.rainRoute.routeName = 'javascript';
        session.getHandle(options)(request, response, next);
        expect(next).toHaveBeenCalled();

        request.rainRoute.routeName = 'css';
        session.getHandle(options)(request, response, next);
        expect(next).toHaveBeenCalled();

        expect(request.sessionStore).toBeUndefined();
    });

    it('should create a new session if the session id is missing', function () {
        session.getHandle(options)(request, response, next);
        expect(sessionStore.createNewSession).toHaveBeenCalledWith(request, next);
    });

    it('should get the session if the session id is found', function () {
        request.signedCookies['rain.sid'] = '1234';
        session.getHandle(options)(request, response, next);
        expect(request.sessionId).toBe('1234');
        expect(pauseFn).toHaveBeenCalled();
        expect(sessionStore.get).toHaveBeenCalledWith(request, jasmine.any(Function));
        expect(next).toHaveBeenCalledWith(undefined);
    });

    it('should get the session and call next with the session error', function () {
        storeErr = {
            message: 'some error'
        };
        request.signedCookies['rain.sid'] = '1234';
        session.getHandle(options)(request, response, next);
        expect(request.sessionId).toBe('1234');
        expect(pauseFn).toHaveBeenCalled();
        expect(sessionStore.get).toHaveBeenCalledWith(request, jasmine.any(Function));
        expect(next).toHaveBeenCalledWith(storeErr);
        expect(pause.resume).toHaveBeenCalled();
    });

    it('should save the session on request end', function () {
        request.signedCookies['rain.sid'] = '1234';
        session.getHandle(options)(request, response, next);

        request.session = undefined;
        response.end();
        expect(response.end).toHaveBeenCalled();
        expect(sessionStore.save).not.toHaveBeenCalled();

        request.sessionId = undefined;
        session.getHandle(options)(request, response, next);
        request.session = {
            a: 1
        };
        response.end();
        expect(sessionStore.save).toHaveBeenCalledWith(request.session, jasmine.any(Function));
        expect(response.end).toHaveBeenCalled();
    });

    it('should not set the cookie is session is missing', function () {
        request.signedCookies['rain.sid'] = '1234';
        session.getHandle(options)(request, response, next);
        request.session = undefined;
        headerFn();
        expect(response.setHeader).not.toHaveBeenCalled();
    });

    it('should not set the cookie if expires is missing', function () {
        request.signedCookies['rain.sid'] = '1234';
        session.getHandle(options)(request, response, next);
        request.session = {
            cookie: {
                expires: null,
                serialize: jasmine.createSpy()
            }
        };
        request.sessionIsNew = false;
        headerFn();
        expect(response.setHeader).not.toHaveBeenCalled();
    });

    it('should only send secure cookies via https', function () {
        request.signedCookies['rain.sid'] = '1234';
        session.getHandle(options)(request, response, next);
        request.session = {
            cookie: {
                secure: true,
                serialize: jasmine.createSpy()
            }
        };
        headerFn();
        expect(response.setHeader).not.toHaveBeenCalled();
    });

    it('should set the cookie header', function () {
        request.signedCookies['rain.sid'] = '1234';
        session.getHandle(options)(request, response, next);
        request.session = {
            cookie: {
                serialize: jasmine.createSpy()
            }
        };
        headerFn();
        expect(response.setHeader).toHaveBeenCalled();
    });
});

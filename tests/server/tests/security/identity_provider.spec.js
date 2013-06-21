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

var path = require('path'),
    Deferred = require('promised-io/promise').Deferred,
    myProvider = path.join(process.cwd(), 'my-provider'),
    configuration, sessionStore, isSaved, isNotLogged, err;

describe('The identity provider', function () {
    var mocks = {}, Spy = {}, IdentityProvider, session;

    beforeEach(function () {
        configuration = {
            identity: {
                provider: 'my-provider'
            }
        };

        isSaved = false;
        isNotLogged = false;
        err = null;
        sessionStore = jasmine.createSpyObj('sessionStore', ['save', 'destroy']);
        sessionStore.save.andDefer(function (defer) {
            defer.resolve();
        });
        sessionStore.destroy.andDefer(function (defer) {
            defer.resolve();
        });

        mocks = {
            '../configuration': configuration,
            '../server': {
                sessionStore: sessionStore
            },
            '../logging': {
                get: function () {
                    return jasmine.createSpyObj('logger',
                                                ['debug', 'info', 'warn', 'error', 'fatal']);
                }
            }
        };
        mocks[myProvider] = jasmine.createSpy('Spy.provider');
        mocks['./user'] = jasmine.createSpy('Spy.userClass');
        mocks['./user'].andReturn({isAuthenticated: function () {return false}});

        Spy = {
            configuration: configuration
        };
        Spy.provider = mocks[myProvider];
        Spy.userClass = mocks['./user'];

        session = jasmine.createSpyObj('session', ['destroy']);
        session = {
            get: jasmine.createSpy().andCallFake(function () {
                return 'user';
            }),
            set: jasmine.createSpy()
        };
        session.id = 'my-session';
    });

    describe('get method', function () {
        it('should corectly get an instance of the configured implementation', function () {
            IdentityProvider = loadModuleExports('/lib/security/identity_provider.js', mocks);
            var provider = IdentityProvider.get(session);

            expect(provider instanceof Spy.provider).toBe(true);

            expect(mocks[myProvider]).toHaveBeenCalled();
            expect(mocks[myProvider].mostRecentCall.args[0]).toEqual(session);
        });

        it('should throw an error if the identity implementation does not exist', function () {
            mocks[myProvider] = undefined;

            IdentityProvider = loadModuleExports('/lib/security/identity_provider.js', mocks);

            expect(function () {
                IdentityProvider.get(session);
            }).toThrow();
        });
    });

    describe('functionality', function () {
        beforeEach(function () {
            Spy.provider = jasmine.createSpyObj('Spy.provider', ['_authenticate', '_getUserClass']);
            mocks[myProvider] = jasmine.createSpy('Spy.providerClass').andReturn(Spy.provider);

            IdentityProvider = loadModuleExports('/lib/security/identity_provider.js', mocks);
        });

        it('should properly login the user and save the session', function () {
            var deferred = new Deferred(),
                callback = jasmine.createSpy();

            spyOn(IdentityProvider.prototype, '_authenticate').andReturn(deferred.promise);

            var provider = new IdentityProvider(session);

            runs(function () {
                provider.login('user', 'pass').then(callback);
                process.nextTick(function () {
                    deferred.resolve('some user');
                });
            });

            waitsFor(function () {
                return callback.wasCalled;
            }, 'user to be logged in');

            runs(function () {
                expect(callback).toHaveBeenCalledWith('some user');
                expect(session.set.mostRecentCall.args[0]).toBe('user');
                expect(session.set.mostRecentCall.args[1]).toBe('some user');
            });
        });

        it('should reject on login error', function () {
            var deferred = new Deferred(),
                done = false,
                callback = jasmine.createSpy();

            spyOn(IdentityProvider.prototype, '_authenticate').andReturn(deferred.promise);

            var provider = new IdentityProvider(session);

            runs(function () {
                deferred.then(null, function () {
                    done = true;
                });

                provider.login('user', 'pass').then(null, callback);
                process.nextTick(function () {
                    deferred.reject('some error');
                });
            });

            waitsFor(function () {
                return done;
            }, 'login to fail');

            runs(function () {
                expect(callback).toHaveBeenCalledWith('some error');
            });
        });

        it('should logout the user', function () {
            var callback = jasmine.createSpy();

            var provider = new IdentityProvider(session);
            runs(function () {
                provider.logout().then(callback);
            });

            waitsFor(function () {
                return callback.wasCalled;
            }, 'logout to happen');

            runs(function () {
                expect(callback).toHaveBeenCalled();
                expect(sessionStore.destroy.mostRecentCall.args[0]).toBe(session.id);
            });
        });

        it('should reject on logout error', function () {
            var callback = jasmine.createSpy();
            sessionStore.destroy.andDefer(function (defer) {
                defer.reject('some error');
            });

            var provider = new IdentityProvider(session);
            runs(function () {
                err = 'some error';
                provider.logout().then(null, callback);
            });

            waitsFor(function () {
                return callback.wasCalled;
            }, 'logout to fail');

            runs(function () {
                expect(sessionStore.destroy.mostRecentCall.args[0]).toBe(session.id);
                expect(callback).toHaveBeenCalledWith('some error');
            });
        });

        it('should get the user', function () {
            var provider = new IdentityProvider(session);
            provider.getUser();

            expect(session.get.mostRecentCall.args[0]).toBe('user');
            expect(mocks['./user']).toHaveBeenCalledWith('user');
        });

        it('should update the user', function () {
            var provider = new IdentityProvider(session);

            spyOn(IdentityProvider.prototype, 'getUser').andReturn({
                isDirty : function() {return true;},
                toJSON: function() {return 'user object';}
            });

            provider.updateUser();

            expect(session.set.mostRecentCall.args[0]).toBe('user');
            expect(session.set.mostRecentCall.args[1]).toBe(('user object'));
        });
    });

});

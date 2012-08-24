"use strict";

var path = require('path'),
    Deferred = require('promised-io/promise').Deferred;

describe('The identity provider', function () {
    var mocks = {}, Spy = {}, IdentityProvider, session;

    describe('get method', function () {
        beforeEach(function () {
            Spy = {};
            mocks = {};

            session = jasmine.createSpyObj('session', ['destroy']);
            session.id = 'my-session';
        });

        it('should corectly get an instance of the configured implementation', function () {
            Spy.configuration = mocks['../configuration'] = {
                identity: {
                    provider: 'my-provider'
                }
            };

            Spy.provider = mocks[path.join(process.cwd(), 'my-provider')] = jasmine.createSpy('Spy.provider');

            IdentityProvider = loadModuleExports('/lib/security/identity_provider.js', mocks);
            var provider = IdentityProvider.get(session);

            expect(provider instanceof Spy.provider).toBe(true);
        });

        it('should throw an error if the identity implementation is not configured', function () {
            Spy.provider = mocks[path.join(process.cwd(), 'my-provider')] = jasmine.createSpy('Spy.provider');
            Spy.configuration = mocks['../configuration'] = {};

            IdentityProvider = loadModuleExports('/lib/security/identity_provider.js', mocks);

            expect(function () {
                IdentityProvider.get(session);
            }).toThrow();
        });

        it('should throw an error if the identity implementation does not exist', function () {
            Spy.configuration = mocks['../configuration'] = {
                identity: {
                    provider: 'my-provider'
                }
            };

            IdentityProvider = loadModuleExports('/lib/security/identity_provider.js', mocks);

            expect(function () {
                IdentityProvider.get(session);
            }).toThrow();
        });
    });

    describe('functionality', function () {
        beforeEach(function () {
            Spy.configuration = mocks['../configuration'] = {
                identity: {
                    provider: 'my-provider'
                }
            };

            Spy.provider = jasmine.createSpyObj('Spy.provider', ['_authenticate', '_getUserClass']);
            mocks[path.join(process.cwd(), 'my-provider')] = jasmine.createSpy('Spy.providerClass')
                .andReturn(Spy.provider);
            Spy.userClass = mocks['./user'] = jasmine.createSpy('Spy.userClass');

            IdentityProvider = loadModuleExports('/lib/security/identity_provider.js', mocks);
        });

        it('should properly login the user', function () {
            var deferred = new Deferred(),
                done = false,
                callback = jasmine.createSpy();

            spyOn(IdentityProvider.prototype, '_authenticate').andReturn(deferred.promise);

            var provider = new IdentityProvider(session);

            runs(function () {
                deferred.then(function () {
                    done = true;
                });

                provider.login('user', 'pass').then(callback);
                process.nextTick(function () {
                    deferred.resolve('some user');
                });
            });

            waitsFor(function () {
                return done;
            }, 'user to be logged in');

            runs(function () {
                expect(callback).toHaveBeenCalledWith('some user');
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

        it('should log the user out', function () {
            var done = false,
                callback = jasmine.createSpy();

            var provider = new IdentityProvider(session);
            runs(function () {
                session.destroy.andCallFake(function (cb) {
                    process.nextTick(function () {
                        done = true;
                        cb();
                    });
                });

                provider.logout().then(callback);
            });

            waitsFor(function () {
                return done;
            }, 'logout to happen');

            runs(function () {
                expect(callback).toHaveBeenCalled();
            });
        });

        it('should reject on logout error', function () {
            var done = false,
                callback = jasmine.createSpy();

            var provider = new IdentityProvider(session);
            runs(function () {
                session.destroy.andCallFake(function (cb) {
                    process.nextTick(function () {
                        done = true;
                        cb('some error');
                    });
                });

                provider.logout().then(null, callback);
            });

            waitsFor(function () {
                return done;
            }, 'logout to fail');

            runs(function () {
                expect(callback).toHaveBeenCalledWith('some error');
            });
        });
    });
});

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

describe('MongoDB session store', function () {

    var MongoDBSessionStore, Mocks, Spy;
    var store, cookie, config;

    beforeEach(function () {
        Spy = jasmine.createSpyObj('Spy', ['Cookie', 'BaseSessionStore',
                'MongoDBSession']);

        // Logger spy
        Spy.LoggerInstance = jasmine.createSpyObj('Spy.LoggerInstance', [
                'debug', 'info', 'warn', 'error', 'fatal']);
        Spy.Logger = jasmine.createSpyObj('Spy.Logger', ['get']);
        Spy.Logger.get.andReturn(Spy.LoggerInstance);

        // MongoDB driver spy
        Spy.MongoDB = jasmine.createSpyObj('Spy.MongoDB', ['Server',
                'ServerInstance', 'Db', 'Collection']);

        Spy.MongoDB.Server.andReturn(Spy.MongoDB.ServerInstance);

        Spy.MongoDB.DbInstance = jasmine.createSpyObj('Spy.MongoDB.DbInstance',
                ['open']);
        Spy.MongoDB.DbInstance.open.andCallFake(function (fn) {
            fn(null, Spy.MongoDB.DbInstance);
        });
        Spy.MongoDB.Db.andReturn(Spy.MongoDB.DbInstance);

        Spy.MongoDB.CollectionInstance = jasmine.createSpyObj(
                'Spy.MongoDB.CollectionInstance', ['findOne', 'insert',
                'update', 'remove', 'ensureIndex']);
        Spy.MongoDB.Collection.andCallFake(function () {
                return Spy.MongoDB.CollectionInstance; });

        Spy.BaseSessionStore.andCallFake(function (cookie) {
            this.cookie = cookie;
        });

        Mocks = {};
        Mocks['mongodb'] = Spy.MongoDB;
        Mocks['connect/lib/middleware/session/cookie'] = Spy.Cookie;
        Mocks['../base_session_store'] = Spy.BaseSessionStore;
        Mocks['../base_session'] = Spy.MongoDBSession;
        Mocks['../logging'] = Spy.Logger;

        MongoDBSessionStore = loadModuleExports('/lib/session/stores/mongodb.js', Mocks);

        cookie = {
            expires: new Date(Date.now() + 1000 * 60 * 60).toUTCString()
        };
        config = {
            host: 'rain.1and1.com',
            port: 1337,
            database: 'session'
        };
    });

    describe('constructor', function () {
        it('should initialize correctly', function () {
            spyOn(MongoDBSessionStore.prototype, '_initialize');
            store = new MongoDBSessionStore(config);

            expect(Spy.BaseSessionStore).toHaveBeenCalledWith(config);
            expect(store._initialize).toHaveBeenCalledWith(config);
        });
    });

    describe('_initialize', function () {
        it('should throw an error if config is incomplete',
                function () {

            function test() {
                expect(function() { new MongoDBSessionStore(cookie, config); })
                        .toThrowType(RainError.ERROR_PRECONDITION_FAILED);
            }

            config = undefined;
            test();
            config = {};
            test();
            config = {host: 'rain.1and1.com'};
            test();
            config = {host: 'rain.1and1.com', port: 1337};
            test();
        });

        it('should create the server, db and collection', function () {
            store = new MongoDBSessionStore(config);

            expect(Spy.MongoDB.Server).toHaveBeenCalledWith(config.host,
                    config.port, {});
            expect(Spy.MongoDB.Db).toHaveBeenCalledWith(config.database,
                    Spy.MongoDB.ServerInstance, {w: 1});
            expect(Spy.MongoDB.Collection).toHaveBeenCalledWith(
                    Spy.MongoDB.DbInstance, 'sessions');
        });
    });

    describe('get', function () {
        var request, session;

        beforeEach(function () {
            request = {
                sessionId: 'ffa5d',
                component: {
                    id: 'test'
                }
            };
        });

        it('should reject the promise with an error if findOne returns an error',
                function () {
            Spy.MongoDB.CollectionInstance.findOne.andCallFake(
                    function (selector, fields, callback) {
                        callback(new Error()); });

            store = new MongoDBSessionStore(config);
            var isResolved;
            store.get(request.sessionId, request.componentId).then(
                    function() {
                        isResolved = true;
                    },
                    function () {
                        isResolved = false;
                    }
                    );
            waitsFor(function() {
                return typeof isResolved !== 'undefined';
            });

            runs(function () {
                expect(isResolved).toBe(false);
            });
        });

        it('should create a new session if the session wasn\'t found',
                function () {
            Spy.MongoDB.CollectionInstance.findOne.andCallFake(
                    function (selector, fields, callback) { callback(); });
            spyOn(MongoDBSessionStore.prototype, 'createNewSession');

            store = new MongoDBSessionStore(config);
            var isResolved;
            store.get(request.sessionId, request.componentId).then(function () {
                isResolved = true;
            }, function () {
                isResolved = false;
            });

            waitsFor(function () {
                return typeof isResolved !== 'undefined';
            });

            runs(function () {
                expect(isResolved).toBe(true);
                expect(Spy.MongoDBSession)
                    .toHaveBeenCalledWith();
            });
        });

        it('should create a session object with a found session that is fresh',
                function () {
            session = {
                cookie: {
                    expires: new Date(Date.now() + 1000 * 60 * 60).toUTCString()
                },
                components: {
                    test: {}
                },
                global: {}
            };

            Spy.MongoDB.CollectionInstance.findOne.andCallFake(
                    function (selector, fields, callback) {
                        callback(null, session); });

            store = new MongoDBSessionStore(config);
            var isResolved;
            store.get(request.sessionId, request.componentId).then(function () {
                isResolved = true;
            }, function () {
                isResolved = false;
            });

            waitsFor(function () {
                return typeof isResolved !== 'undefined';
            });

            runs(function () {
                expect(isResolved).toBe(true);
                expect(Spy.MongoDBSession.argsForCall[0]).toEqual([{}]);
                expect(Spy.MongoDBSession.argsForCall[1]).toEqual(undefined);
            });
        });

    });

    describe('createNewSession', function () {
        var request;

        beforeEach(function () {
            request = {
                sessionId: 'ffa5d',
                component: {
                    id: 'comp'
                }
            };
        });

        it('should insert the session into the store', function () {
            Spy.MongoDB.CollectionInstance.insert.andCallFake(
                    function (docs, options, callback) { callback(); });
            store = new MongoDBSessionStore(config);
            var isResolved;
            store.createNewSession(request.sessionId).then(function () {
                isResolved = true;
            }, function () {
                isResolved = false;
            });

            waitsFor(function () {
                return typeof isResolved !== 'undefined';
            });

            runs(function () {
                expect(Spy.MongoDB.CollectionInstance.insert).toHaveBeenCalled();
                expect(Spy.MongoDBSession).toHaveBeenCalled();
                expect(isResolved).toBe(true);
            });
        });
    });

    describe('save', function () {
        var session;

        beforeEach(function () {
            session = {
                id: 'ffa5d',
                isEmpty: true,
                _updatedKeys: [],
                _removedKeys: [],
                _session: {},
                _componentId: 'test'
            };

            Spy.MongoDB.CollectionInstance.update.andCallFake(
                    function (selector, document, options, callback) {
                        callback();
                    });
        });

        describe('components', function () {
            it('should set updated keys', function () {
                session._updatedKeys = ['key-a', 'key-b'];
                session._session = {
                    'key-a': {value: 'a'},
                    'key-b': {value: 'b'}
                };

                store = new MongoDBSessionStore(config);
                var isResolved;
                store.save(session).then(function () {
                    isResolved = true;
                }, function () {
                    isResolved = false;
                });

                waitsFor(function () {
                    return typeof isResolved !== 'undefined';
                });

                runs(function () {
                    var args = Spy.MongoDB.CollectionInstance.update.mostRecentCall.args;
                    expect(isResolved).toBe(true);
                    expect(args[0]).toEqual({_id: session.id});
                    expect(args[1]).toEqual({
                        $set: {
                            'components.test.key-a': {value: 'a'},
                            'components.test.key-b': {value: 'b'},
                            'lastModified': jasmine.any(Object)
                        }
                    });
                });
            });

            it('should unset removed keys', function () {
                session._removedKeys = ['key-c'];
                session._session = {
                    'key-c': {value: 'c'}
                };

                store = new MongoDBSessionStore(config);
                var isResolved;
                store.save(session).then(function () {
                    isResolved = true;
                }, function () {
                    isResolved = false;
                });

                waitsFor(function () {
                    return typeof isResolved !== 'undefined';
                });

                runs(function () {
                    var args = Spy.MongoDB.CollectionInstance.update.mostRecentCall.args;
                    expect(isResolved).toBe(true);
                    expect(args[0]).toEqual({_id: session.id});
                    expect(args[1]).toEqual({
                        $set: {
                            lastModified: jasmine.any(Object)
                        },
                        $unset: {
                            'components.test.key-c': 1
                        }
                    });
                });
            });

            it('should set changed keys and unset removed keys', function () {
                session._updatedKeys = ['key-a', 'key-b'];
                session._removedKeys = ['key-c'];
                session._session = {
                    'key-a': {value: 'a'},
                    'key-b': {value: 'b'},
                    'key-c': {value: 'c'}
                };

                store = new MongoDBSessionStore(config);
                var isResolved;
                store.save(session).then(function () {
                    isResolved = true;
                }, function () {
                    isResolved = false;
                });

                waitsFor(function () {
                    return typeof isResolved !== 'undefined';
                });

                runs(function () {
                    var args = Spy.MongoDB.CollectionInstance.update.mostRecentCall.args;
                    expect(isResolved).toBe(true);
                    expect(args[0]).toEqual({_id: session.id});
                    expect(args[1]).toEqual({
                        $set: {
                            'components.test.key-a': {value: 'a'},
                            'components.test.key-b': {value: 'b'},
                            lastModified: jasmine.any(Object)
                        },
                        $unset: {
                            'components.test.key-c': 1
                        }
                    });
                });
            });
        });

        describe('global', function () {
            it('should set changed keys and unset removed keys', function () {
                session._componentId = null;
                session._updatedKeys = ['key-a', 'key-b'];
                session._removedKeys = ['key-c'];
                session._session = {
                    'key-a': {value: 'a'},
                    'key-b': {value: 'b'},
                    'key-c': {value: 'c'}
                };

                store = new MongoDBSessionStore(config);
                var isResolved;
                store.save(session).then(function () {
                    isResolved = true;
                }, function () {
                    isResolved = false;
                });

                waitsFor(function () {
                    return typeof isResolved !== 'undefined';
                });

                runs(function () {
                    var args = Spy.MongoDB.CollectionInstance.update.mostRecentCall.args;
                    expect(isResolved).toBe(true);
                    expect(args[0]).toEqual({_id: session.id});
                    expect(args[1]).toEqual({
                        $set: {
                            'global.key-a': {value: 'a'},
                            'global.key-b': {value: 'b'},
                            lastModified: jasmine.any(Object)
                        },
                        $unset: {
                            'global.key-c': 1
                        }
                    });
                });
            });
        });
    });

    describe('destroy', function () {
        var sessionId;

        beforeEach(function () {
            Spy.MongoDB.CollectionInstance.remove.andCallFake(
                    function (selector, options, callback) {
                        callback(); });
            sessionId = '55fad';
        });

        it('should destroy the entire session', function () {
            store = new MongoDBSessionStore(config);
            var isResolved;
            store.destroy(sessionId).then(function () {
                isResolved = true;
            }, function () {
                isResolved = false;
            });

            waitsFor(function () {
                return typeof isResolved !== 'undefined';
            });

            runs(function () {
                var args = Spy.MongoDB.CollectionInstance.remove.mostRecentCall.args;
                expect(isResolved).toBe(true);
                expect(args[0]).toEqual({_id: sessionId});
            });
        });
    });
});

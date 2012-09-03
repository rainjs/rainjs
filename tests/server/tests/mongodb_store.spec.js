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
                'update', 'remove']);
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

        MongoDBSessionStore = loadModuleExports(
                '/lib/mongodb/session_store.js', Mocks);

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
            store = new MongoDBSessionStore(cookie, config);

            expect(Spy.BaseSessionStore).toHaveBeenCalledWith(cookie);
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
            store = new MongoDBSessionStore(cookie, config);

            expect(Spy.MongoDB.Server).toHaveBeenCalledWith(config.host,
                    config.port, {});
            expect(Spy.MongoDB.Db).toHaveBeenCalledWith(config.database,
                    Spy.MongoDB.ServerInstance, {});
            expect(Spy.MongoDB.Collection).toHaveBeenCalledWith(
                    Spy.MongoDB.DbInstance, 'sessions');
        });
    });

    describe('get', function () {
        var request, callback, session;

        beforeEach(function () {
            request = {
                sessionId: 'ffa5d',
                component: {
                    id: 'test'
                }
            };
            callback = jasmine.createSpy('findOne callback');
        });

        it('should call the callback with the error if findOne returns an error',
                function () {
            Spy.MongoDB.CollectionInstance.findOne.andCallFake(
                    function (selector, fields, callback) {
                        callback(new Error()); });

            store = new MongoDBSessionStore(cookie, config);
            store.get(request, callback);

            expect(callback).toHaveBeenCalledWith(jasmine.any(Error));
        });

        it('should create a new session if the session wasn\'t found',
                function () {
            Spy.MongoDB.CollectionInstance.findOne.andCallFake(
                    function (selector, fields, callback) { callback(); });
            spyOn(MongoDBSessionStore.prototype, 'createNewSession');

            store = new MongoDBSessionStore(cookie, config);
            store.get(request, callback);

            expect(MongoDBSessionStore.prototype.createNewSession)
                .toHaveBeenCalledWith(request, callback);
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

            store = new MongoDBSessionStore(cookie, config);
            store.get(request, callback);

            expect(Spy.MongoDBSession.argsForCall[0]).toEqual([
                    session.components.test, request.component]);
            expect(Spy.MongoDBSession.argsForCall[1]).toEqual([session.global]);
            expect(callback).toHaveBeenCalled();
        });

        it('should destroy the session if it\'s expired', function () {
            session = {
                cookie: {
                    expires: new Date(Date.now() - 1000 * 60 * 60).toUTCString()
                }
            };

            Spy.MongoDB.CollectionInstance.findOne.andCallFake(
                    function (selector, fields, callback) {
                        callback(null, session); });

            spyOn(MongoDBSessionStore.prototype, 'destroy');
            store = new MongoDBSessionStore(cookie, config);
            store.get(request, callback);

            expect(MongoDBSessionStore.prototype.destroy).toHaveBeenCalledWith(
                request.sessionId, jasmine.any(Function));
        });
    });

    describe('createNewSession', function () {
        beforeEach(function () {
            request = {
                sessionId: 'ffa5d',
                component: {
                    id: 'comp'
                }
            };
            callback = jasmine.createSpy('insert callback');
        });

        it('should insert the session into the store', function () {
            Spy.MongoDB.CollectionInstance.insert.andCallFake(
                    function (docs, options, callback) { callback(); });
            store = new MongoDBSessionStore(cookie, config);
            store.createNewSession(request, callback);

            expect(Spy.MongoDB.CollectionInstance.insert).toHaveBeenCalled();
            expect(Spy.MongoDBSession).toHaveBeenCalled();
            expect(callback).toHaveBeenCalled();
        });
    });

    describe('save', function () {
        var session;

        beforeEach(function () {
            session = {
                id: 'ffa5d',
                isGlobal: false,
                cookie: cookie,
                _component: {id: 'test'},
                _updatedKeys: [],
                _removedKeys: [],
                _session: {}
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

                store = new MongoDBSessionStore(cookie, config);
                store.save(session, callback);

                var args = Spy.MongoDB.CollectionInstance.update.mostRecentCall.args;
                expect(args[0]).toEqual({id: session.id});
                expect(args[1]).toEqual({
                    $set: {
                        cookie: session.cookie,
                        'components.test.key-a': {value: 'a'},
                        'components.test.key-b': {value: 'b'}
                    }
                });
            });

            it('should unset removed keys', function () {
                session._removedKeys = ['key-c'];
                session._session = {
                    'key-c': {value: 'c'}
                };

                store = new MongoDBSessionStore(cookie, config);
                store.save(session, callback);

                var args = Spy.MongoDB.CollectionInstance.update.mostRecentCall.args;
                expect(args[0]).toEqual({id: session.id});
                expect(args[1]).toEqual({
                    $set: {
                        cookie: session.cookie
                    },
                    $unset: {
                        'components.test.key-c': 1
                    }
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

                store = new MongoDBSessionStore(cookie, config);
                store.save(session, callback);

                var args = Spy.MongoDB.CollectionInstance.update.mostRecentCall.args;
                expect(args[0]).toEqual({id: session.id});
                expect(args[1]).toEqual({
                    $set: {
                        cookie: session.cookie,
                        'components.test.key-a': {value: 'a'},
                        'components.test.key-b': {value: 'b'}
                    },
                    $unset: {
                        'components.test.key-c': 1
                    }
                });
            });
        });

        describe('global', function () {
            it('should set changed keys and unset removed keys', function () {
                session.isGlobal = true;
                session._updatedKeys = ['key-a', 'key-b'];
                session._removedKeys = ['key-c'];
                session._session = {
                    'key-a': {value: 'a'},
                    'key-b': {value: 'b'},
                    'key-c': {value: 'c'}
                };

                store = new MongoDBSessionStore(cookie, config);
                store.save(session, callback);

                var args = Spy.MongoDB.CollectionInstance.update.mostRecentCall.args;
                expect(args[0]).toEqual({id: session.id});
                expect(args[1]).toEqual({
                    $set: {
                        cookie: session.cookie,
                        'global.key-a': {value: 'a'},
                        'global.key-b': {value: 'b'}
                    },
                    $unset: {
                        'global.key-c': 1
                    }
                });
            });
        });
    });

    describe('destroy', function () {
        var sessionId, callback;

        beforeEach(function () {
            Spy.MongoDB.CollectionInstance.remove.andCallFake(
                    function (selector, options, callback) {
                        callback(); });
            sessionId = '55fad';
            callback = jasmine.createSpy('destroy callback');
        });

        it('should destroy the entire session', function () {
            store = new MongoDBSessionStore(cookie, config);
            store.destroy(sessionId, callback);

            var args = Spy.MongoDB.CollectionInstance.remove.mostRecentCall.args;
            expect(args[0]).toEqual({id: sessionId});
            expect(callback).toHaveBeenCalled();
        });
    });
});
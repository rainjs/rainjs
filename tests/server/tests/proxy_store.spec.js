"use strict";

describe('proxy store', function () {
    var proxy;

    var ProxyStore = require(process.cwd() + '/lib/proxy_store');
    var MockStore = require('../lib/mock_store');

    var sid1 = 'alfa';
    var session1 = {letter: '\u03b1', cookie: {path: 'alfa/'}};

    var sid2 = 'beta';
    var session2 = {letter: '\u03b2', cookie: {path: 'beta/'}};

    beforeEach(function () {
        proxy = new ProxyStore(MockStore);
    });

    it('should save a session to the configured store', function () {
        var isSaved;

        runs(function () {
            proxy.set(sid1, session1, function () {
                isSaved = true;
            });
        });

        waitsFor(function () {
            return isSaved;
        }, 'the session to be saved');

        runs(function () {
            expect(proxy.store.sessions[sid1]).toEqual(session1);
            expect(Object.keys(proxy.store.sessions).length).toEqual(1);
        });
    });

    it('should save multiple sessions to the configured store', function () {
        var isSaved1, isSaved2;

        runs(function () {
            proxy.set(sid1, session1, function () {
                isSaved1 = true;
            });

            proxy.set(sid2, session2, function () {
                isSaved2 = true;
            });
        });

        waitsFor(function () {
            return isSaved1 && isSaved2;
        }, 'both sessions to be saved');

        runs(function () {
            expect(proxy.store.sessions[sid1]).toEqual(session1);
            expect(proxy.store.sessions[sid2]).toEqual(session2);
            expect(Object.keys(proxy.store.sessions).length).toEqual(2);
        });
    });

    it('should retrieve a session from the store after storing it', function () {
        var isSaved, sess;

        runs(function () {
            proxy.set(sid1, session1, function () {
                isSaved = true;
            });
        });

        waitsFor(function () {
            return isSaved;
        }, 'session to be stored');

        runs(function () {
            proxy.get(sid1, function (error, data) {
                sess = data;
            });
        });

        waitsFor(function () {
            return !!sess;
        }, 'session to be retrieved');

        runs(function () {
            expect(sess).toEqual(session1);
        });
    });

    it('should retrieve multiple sessions from the store after storing them',
        function () {

        var isSaved1, isSaved2, sess1, sess2;

        runs(function () {
            proxy.set(sid1, session1, function () {
                isSaved1 = true;
            });
            proxy.set(sid2, session2, function () {
                isSaved2 = true;
            });
        });

        waitsFor(function () {
            return isSaved1 && isSaved2;
        }, 'sessions to be stored');

        runs(function () {
            proxy.get(sid1, function (error, data) {
                sess1 = data;
            });
            proxy.get(sid2, function (error, data) {
                sess2 = data;
            });
        });

        waitsFor(function () {
            return !!sess1 && !!sess2;
        }, 'sessions to be retrieved');

        runs(function () {
            expect(sess1).toEqual(session1);
            expect(sess2).toEqual(session2);
        });
    });

    it('should delete a session from the store when destroyed', function () {
        var isSaved, isDestroyed;

        runs(function () {
            proxy.set(sid1, session1, function () {
                isSaved = true;
            });
        });

        waitsFor(function () {
            return isSaved;
        }, 'session to be saved');

        runs(function () {
            proxy.destroy(sid1, function () {
                isDestroyed = true;
            });
        });

        waitsFor(function () {
            return isDestroyed;
        }, 'session to be destroyed');

        runs(function () {
            expect(proxy.store.sessions[sid1]).toBeUndefined();
            expect(Object.keys(proxy.store.sessions).length).toEqual(0);
        });
    });

    it('should destroy multiple sessions from the store after destroying them',
        function () {

        var isSaved1, isSaved2, isDestroyed1, isDestroyed2;

        runs(function () {
            proxy.set(sid1, session1, function () {
                isSaved1 = true;
            });
            proxy.set(sid2, session2, function () {
                isSaved2 = true;
            });
        });

        waitsFor(function () {
            return isSaved1 && isSaved2;
        }, 'sessions to be saved');

        runs(function () {
            proxy.destroy(sid1, function () {
                isDestroyed1 = true;
            });
            proxy.destroy(sid2, function () {
                isDestroyed2 = true;
            });
        });

        waitsFor(function () {
            return isDestroyed1 && isDestroyed2;
        }, 'the sessions to be destryoed');

        runs(function () {
            expect(proxy.store.sessions[sid1]).toBeUndefined();
            expect(proxy.store.sessions[sid2]).toBeUndefined();
            expect(Object.keys(proxy.store.sessions).length).toEqual(0);
        });
    });
});

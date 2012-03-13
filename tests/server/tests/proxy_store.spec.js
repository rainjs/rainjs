"use strict";

describe('Proxy store', function () {
    var store;

    var ProxyStore = require(process.cwd() + '/lib/proxy_store');
    var MockStore = require('../lib/mock_store');

    var sid1 = 'alfa';
    var remotesid1 = 'omega';
    var session1 = {letter: '\u03b1', cookie: {path: 'alfa/'}};

    var sid2 = 'beta';
    var remotesid2 = 'gamma';
    var session2 = {letter: '\u03b2', cookie: {path: 'beta/'}};

    var sid3 = 'delta';
    var session3 = {letter: '\u03b3', cookie: {path: 'delta/'}};

    beforeEach(function () {
        store = new ProxyStore(MockStore, MockStore);
    });

    it('must save to local store by default', function () {
        var isSaved;

        runs(function () {
            store.set(sid1, session1, function () {
                isSaved = true;
            });
        });

        waitsFor(function () {
            return isSaved;
        }, 'Session couldn\'t be saved.');

        runs(function () {
            expect(store.localStore.sessions[sid1]).toEqual(session1);
            expect(Object.keys(store.localStore.sessions).length).toEqual(1);
            expect(store.remoteStore.sessions[sid1]).toBeUndefined();
            expect(Object.keys(store.remoteStore.sessions).length).toEqual(0);
        });
    });

    it('must save multiple sessions to local store by default', function () {
        var isSaved1, isSaved2;

        runs(function () {
            store.set(sid1, session1, function () {
                isSaved1 = true;
            });

            store.set(sid2, session2, function () {
                isSaved2 = true;
            });
        });

        waitsFor(function () {
            return isSaved1 && isSaved2;
        }, 'One of the sessions couldn\'t be saved.');

        runs(function () {
            expect(store.localStore.sessions[sid1]).toEqual(session1);
            expect(store.localStore.sessions[sid2]).toEqual(session2);
            expect(Object.keys(store.localStore.sessions).length).toEqual(2);
            expect(store.remoteStore.sessions[sid1]).toBeUndefined();
            expect(store.remoteStore.sessions[sid2]).toBeUndefined();
            expect(Object.keys(store.remoteStore.sessions).length).toEqual(0);
        });
    });

    it('must save to remote store after authorizing a session', function () {
        var isAuthorized;

        runs(function () {
            store.authorize(sid1, remotesid1, session1);
            store.set(sid1, session1, function () {
                isAuthorized = true;
            });
        });

        waitsFor(function () {
            return isAuthorized;
        }, 'Session wasn\'t authorized.');

        runs(function () {
            expect(store.remoteStore.sessions[remotesid1]).toEqual(session1);
            expect(Object.keys(store.remoteStore.sessions).length).toEqual(1);
            expect(store.localStore.sessions[sid1]).toBeUndefined();
            expect(Object.keys(store.localStore.sessions).length).toEqual(0);
        });
    });

    it('must switch to remote store after authorizing', function () {
        var isSaved1, isSaved2, isAuthorized;

        runs(function () {
            store.set(sid1, session1, function () {
                isSaved1 = true;
            });

            store.set(sid2, session2, function () {
                isSaved2 = true;
            });
        });

        waitsFor(function () {
            return isSaved1 && isSaved2;
        }, 'Sessions weren\'t saved.');

        runs(function () {
            store.authorize(sid1, remotesid1, session1);
            store.set(sid1, session1, function () {
                isAuthorized = true;
            });
        });

        waitsFor(function () {
            return isAuthorized;
        }, 'Session wasn\'t authorized.');

        runs(function () {
            expect(store.localStore.sessions[sid1]).toEqual(session1);
            expect(store.localStore.sessions[sid2]).toEqual(session2);
            expect(Object.keys(store.localStore.sessions).length).toEqual(2);
            expect(store.remoteStore.sessions[remotesid1]).toEqual(session1);
            expect(store.remoteStore.sessions[sid2]).toBeUndefined();
            expect(Object.keys(store.remoteStore.sessions).length).toEqual(1);
        });
    });

    it('must read from the local store for unauthorized sessions', function () {
        var isSaved, sess;

        runs(function () {
            store.set(sid1, session1, function () {
                isSaved = true;
            });
        });

        waitsFor(function () {
            return isSaved;
        }, 'Session wasn\'t saved.');

        runs(function () {
            store.get(sid1, function (error, data) {
                sess = data;
            });
        });

        waitsFor(function () {
            return !!sess;
        }, 'Session wasn\'t read.');

        runs(function () {
            expect(sess).toEqual(session1);
        });
    });

    it('must read from the remote store for authorized sessions', function () {
        var isSaved, isAuthorized, sess1, sess2;

        runs(function () {
            store.authorize(sid1, remotesid1, session1);
            store.set(sid1, session1, function () {
                isAuthorized = true;
            });
        });

        waitsFor(function () {
            return isAuthorized;
        }, 'Session wasn\'t authorized.');

        runs(function () {
            store.set(sid2, session2, function () {
                isSaved = true;
            });
        });

        waitsFor(function () {
            return isSaved;
        }, 'Session wasn\'t saved.');

        runs(function () {
            store.get(sid1, function (error, data) {
                sess1 = data;
            });
            store.get(sid2, function (error, data) {
                sess2 = data;
            });
        });

        waitsFor(function () {
            return !!sess1 && !!sess2;
        }, 'Sessions weren\'t read.');

        runs(function () {
            expect(sess1).toEqual(session1);
            expect(sess2).toEqual(session2);
        });
    });

    it('must destroy the local session for an unauthorized one', function () {
        var isSaved, isDestroyed;

        runs(function () {
            store.set(sid1, session1, function () {
                isSaved = true;
            });
        });

        waitsFor(function () {
            return isSaved;
        }, 'Session wasn\'t saved.');

        runs(function () {
            store.destroy(sid1, function () {
                isDestroyed = true;
            });
        });

        waitsFor(function () {
            return isDestroyed;
        }, 'Session wasn\'t destroyed.');

        runs(function () {
            expect(store.localStore.sessions[sid1]).toBeUndefined();
            expect(Object.keys(store.localStore.sessions).length).toEqual(0);
        });
    });

    it('must destroy both local and remote sessions for an authorized session', function () {
        var isSaved1, isSaved3, isAuthorized1, isAuthorized2, isDestroyed1, isDestroyed2;

        runs(function () {
            store.set(sid1, session1, function () {
                isSaved1 = true;
            });
        });

        waitsFor(function () {
            return isSaved1;
        }, 'Local session 1 wasn\'t saved.');

        runs(function () {
            store.authorize(sid1, remotesid1, session1);
            store.set(sid1, session1, function () {
                isAuthorized1 = true;
            });

            store.authorize(sid2, remotesid2, session2);
            store.set(sid2, session2, function () {
                isAuthorized2 = true;
            });
        });

        waitsFor(function () {
            return isAuthorized1 && isAuthorized2;
        }, 'Two sessions weren\'t authorized');

        runs(function () {
            store.set(sid3, session3, function () {
                isSaved3 = true;
            });
        });

        waitsFor(function () {
            return isSaved3;
        }, 'Local session 3 wasn\'t saved.');

        runs(function () {
            store.destroy(sid1, function () {
                isDestroyed1 = true;
            });
            store.destroy(sid2, function () {
                isDestroyed2 = true;
            });
        });

        waitsFor(function () {
            return isDestroyed1 && isDestroyed2;
        }, 'The two remote sessions were\'t destroyed.');

        runs(function () {

            // Local store should now contain only session 3.
            expect(store.localStore.sessions[sid1]).toBeUndefined();
            expect(store.localStore.sessions[sid3]).toBeDefined();
            expect(Object.keys(store.localStore.sessions).length).toEqual(1);

            // Remote store should be empty.
            expect(store.remoteStore.sessions[sid1]).toBeUndefined();
            expect(store.remoteStore.sessions[sid2]).toBeUndefined();
            expect(Object.keys(store.remoteStore.sessions).length).toEqual(0);
        });
    });
});

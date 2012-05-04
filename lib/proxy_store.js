"use strict";

var Store = require('connect/lib/middleware/session/store'),
    MemoryStore = require('connect/lib/middleware/session/memory'),
    Cookie = require('connect/lib/middleware/session/cookie'),
    Session = require('connect/lib/middleware/session/session'),
    util = require('util'),
    extend = require('node.extend');

/**
 * Proxy store implementation for connect. Uses dependency injection to set the store implementation.
 * By default, a :js:class:`MemoryStore` is used. It uses lazy instantiation.
 *
 * @name ProxyStore
 * @constructor
 * @param {connect.session.Store} [Store=MemoryStore] store implementation
 * @property {connect.session.Store} store the store instance
 * @property {Object} sessionCache cache for session objects for concurrent access control to the store
 */
var ProxyStore = function (Store) {
    var store;

    Object.defineProperty(this, 'store', {
        get: function () { return store = store || new (Store || MemoryStore)(); }
    });

    /*
        Cache for concurrent access control to the store.
        This is a work-around that works only for one RAIN server!
    */
    this.sessionCache = {};
};

util.inherits(ProxyStore, Store);

/**
 * Get the session from the store with a given session id.
 *
 * @param {String} sid the session id
 * @param {Function} fn the callback that is invoked when the session is available
 */
ProxyStore.prototype.get = function (sid, fn) {
    var self = this;
    process.nextTick(function () {
        if (self.sessionCache[sid]) {
            fn(null, self.sessionCache[sid].session);
            self.sessionCache[sid].refCount++;
            return;
        }

        self.store.get(sid, function (err, sess) {
            if (!err) {
                self.sessionCache[sid] = {
                    refCount: 1,
                    session: sess
                };
            }

            fn(err, sess);
        });
    });
};

/**
 * Save the session to the store with a given session id.
 *
 * @param {String} sid the session id
 * @param {connect.session.Session} sess the session to save
 * @param {Function} fn the callback that is invoked after the session is saved
 */
ProxyStore.prototype.set = function (sid, sess, fn) {
    var self = this;
    process.nextTick(function () {
        self.sessionCache[sid] && self.sessionCache[sid].refCount--;
        if (self.sessionCache[sid] && self.sessionCache[sid].refcount  < 1) {
            delete self.sessionCache[sid];
        }

        self.store.set(sid, sess, fn);
    });
};

/**
 * Destroys the session with a given session id.
 *
 * @param {String} sid the session id
 * @param {Function} fn the callback that is invoked after the session is destroyed
 */
ProxyStore.prototype.destroy = function (sid, fn) {
    var self = this;
    process.nextTick(function () {
        if (self.sessionCache[sid]) {
            delete self.sessionCache[sid];
        }

        self.store.destroy(sid, fn);
    });
};

/**
 * Create session from JSON `sess` data.
 *
 * @param {Request} req
 * @param {Object} sess
 * @return {Session}
 * @private
 */
ProxyStore.prototype.createSession = function (req, sess, update) {
    var expires = sess.cookie.expires;
    var orig = sess.cookie.originalMaxAge;
    var update = null == update ? true : false;

    sess.cookie = new Cookie(req, sess.cookie);
    if ('string' == typeof expires) {
        sess.cookie.expires = new Date(expires);
    }

    sess.cookie.originalMaxAge = orig;

    req.session = sess; //new Session(req, sess);
    if (!req.session.req) {
        Object.defineProperty(req.session, 'req', {value: req});
    }
    req.session.lastAccess = Date.now();

    extend(req.session, Session.prototype);

    return req.session;
};

module.exports = ProxyStore;

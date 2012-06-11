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
 * @param {Object} cookie the cookie configuration for the session store
 * @param {String} cookie.path the path to be set to the cookies
 * @param {Boolean} cookie.httpOnly wether the cookie is http only or not
 * @property {connect.session.Store} store the store instance
 * @property {Object} sessionCache cache for session objects for concurrent access control to the store
 */
var ProxyStore = function (Store, cookie) {
    var store;

    Object.defineProperty(this, 'store', {
        get: function () { return store = store || new (Store || MemoryStore)(cookie); }
    });

    // if the store has a generate method make it un writable so that it can't be overriden by the
    // session middleware
    if (this.store.generate) {
        Object.defineProperty(this, 'generate', {
            value: function (request) { return (this.store.generate && this.store.generate.apply(this.store, arguments)); }
        });
    }

    // Cache for concurrent access control to the store.
    // This is a work-around that works only for one RAIN server!
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
ProxyStore.prototype.createSession = function (req, sess) {
    var expires = sess.cookie.expires;
    var orig = sess.cookie.originalMaxAge;

    sess.cookie = new Cookie(req, sess.cookie);
    if ('string' == typeof expires) {
        sess.cookie.expires = new Date(expires);
    }

    sess.cookie.originalMaxAge = orig;

    req.session = sess;
    if (!req.session.req) {
        Object.defineProperty(req.session, 'req', {value: req});
    }
    req.session.lastAccess = Date.now();

    extend(req.session, Session.prototype);

    return req.session;
};

module.exports = ProxyStore;

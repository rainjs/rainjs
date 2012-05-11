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

var Store = require('connect/lib/middleware/session/store');
var MemoryStore = require('connect/lib/middleware/session/memory');
var Cookie = require('connect/lib/middleware/session/cookie');
var Session = require('connect/lib/middleware/session/session');
var util = require('util');
var extend = require('node.extend');

/**
 * Proxy store implementation for connect. Uses dependency injection to aggregate implementations
 * for local and remote stores. By default, a :js:class:`MemoryStore` is used for the local store
 * and a :js:class:`MemoryStore` is used for the remote store. It uses lazy instantiation of stores.
 *
 * It exposes the :js:func:`ProxyStore#authorize` method for switching the store implementation at
 * runtime, i.e. providing a way to switch the store at runtime after login.
 *
 * @name ProxyStore
 * @constructor
 * @param {connect.session.Store} [LocalStore=MemoryStore] store class to use for local storage
 * @param {connect.session.Store} [RemoteStore=MemoryStore] store class to use for remote storage
 * @property {connect.session.Store} localStore the local store instance
 * @property {connect.session.Store} remoteStore the remote store instance
 * @property {Object} authorizedSessions the object associating authorized sids with remote sids
 */
var ProxyStore = function (LocalStore, RemoteStore) {
    var local;
    var remote;

    Object.defineProperty(this, 'localStore', {
        get: function () { return local = local || new (LocalStore || MemoryStore)(); }
    });

    Object.defineProperty(this, 'remoteStore', {
        get: function () { return remote = remote || new (RemoteStore || MemoryStore)(); }
    });

    this.authorizedSessions = {};
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

        getStore(self, sid).get(getId(self, sid), function (err, session) {
            if (!err) {
                self.sessionCache[sid] = {
                    refCount: 1,
                    session: session
                };
            }

            fn(err, session);
        });
    });
};

/**
 * Get the correct session id to pass to the store.
 * A local store must use the cookie sid, a remote store must use
 * the sid stored in the authorizedSesssions map.
 *
 * @param {ProxyStore} self the class instance
 * @param {String} sid the local session id
 * @private
 * @memberOf ProxyStore#
 */
function getId(self, sid) {
    return self.authorizedSessions[sid] || sid;
}

/**
 * Return the store associated with a session.
 *
 * @param {ProxyStore} self the class instance
 * @param {String} sid the session id
 * @returns {connect.session.Store} the store associated to the session
 */
function getStore(self, sid) {
    return (sid in self.authorizedSessions) ? self.remoteStore : self.localStore;
}

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

        getStore(self, sid).set(getId(self, sid), sess, fn);
    });
};

/**
 * Destroys the session with a given session id.
 *
 * Destroys the session both on the remote and on the local stores.
 *
 * @param {String} sid the session id

 * @param {Function} fn the callback that is invoked after the session is destroyed
 */
ProxyStore.prototype.destroy = function (sid, fn) {
    var self = this;
    process.nextTick(function () {
        var remotesid = self.authorizedSessions[sid];
        if (self.sessionCache[sid]) {
            delete self.sessionCache[sid];
        }

        if (remotesid) {
            delete self.authorizedSessions[sid];

            self.remoteStore.destroy(remotesid, function () {
                self.localStore.destroy(sid, fn);
            });
        } else {
            self.localStore.destroy(sid, fn);
        }
    });
};

/**
 * Authorizes a session.
 *
 * Stores the session id in the list of authorized sessions that use the remote store.
 *
 * @param {String} sid the session id to be authorized
 * @param {String} remotesid the remote session id
 * @param {connect.session.Session} sess the session to authorize
 */
ProxyStore.prototype.authorize = function (sid, remotesid, sess) {
    this.authorizedSessions[sid] = remotesid;
};

/**
 * Gets the remote session id.
 *
 * @param {String} sid the session id
 * @returns {String} the remote session id
 */
ProxyStore.prototype.getRemoteSid = function (sid) {
    return this.authorizedSessions[sid];
};

/**
 * Create session from JSON `sess` data.
 *
 * @param {Request} req
 * @param {Object} sess
 * @return {Session}
 * @private
 */
ProxyStore.prototype.createSession = function(req, sess, update){
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

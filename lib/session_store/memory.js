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

var util = require('util'),
    BaseSessionStore = require('../base_session_store'),
    MemorySession = require('../base_session'),
    logger = require('../logging').get(),
    Promise = require('promised-io/promise');

/**
 * Session store implementation using memory store.
 *
 * @name MemoryStore
 * @constructor MemoryStore
 * @param {Object} [storeConfig] the store configuration
 */
function MemoryStore(storeConfig) {
    this._sessionCollection = {};
    BaseSessionStore.call(this, storeConfig);
};

util.inherits(MemoryStore, BaseSessionStore);

/**
 * Gets the session instance associated with session id and component id. If component id is
 * missing then the global session is retrieved.
 *
 * @param {String} sessionId - the session id
 * @param {String} [componentId] - the component's id
 * @returns {Promise}
 */
MemoryStore.prototype.get = function (sessionId, componentId) {
    var deferred = Promise.defer(),
        session,
        sessionData = {};

    if (!this._sessionCollection[sessionId]) {
        if(componentId) {
            session = new MemorySession(undefined, componentId);
        } else {
            session = new MemorySession();
        }

        session.id = sessionId;
    } else {
        sessionData = this._sessionCollection[sessionId];
        if(componentId) {
            session = new MemorySession(sessionData.components[componentId], componentId);
        } else {
            session = new MemorySession(sessionData.global);
        }
    }

    process.nextTick(function () {
        deferred.resolve(session);
    });

    return deferred.promise;
};

/**
 * Generates an empty session associated with the sessionId in the store and the promise is
 * resolved with the created session.
 * If the session can't be created the promise is rejected.
 *
 * @param {String} sessionId - the sessionId
 * @return {Promise}
 */
MemoryStore.prototype.createNewSession = function (sessionId) {
    var deferred = Promise.defer();

    this._sessionCollection[sessionId] = {
        id: sessionId,
        global: {},
        components: {}
    };

    var session = new MemorySession();
    session.id = sessionId;

    process.nextTick(function () {
        deferred.resolve(session);
    });

    return deferred.promise;
};

/**
 * Saves the specified session instance. Only the keys marked as dirty are saved.
 *
 * @param {Session} session the session to save
 * @param {Promise} returns a rejected promise if error, else the promise is resolved.
 */
MemoryStore.prototype.save = function (session) {
    var deferred = Promise.defer(),
        key;

    if (session.id && typeof session._componentId !== 'undefined' &&
            !this._sessionCollection[session.id].components[session._componentId]) {
        this._sessionCollection[session.id].components[session._componentId] = {};
    }

        for (var i = session._updatedKeys.length - 1; i >= 0; i--) {
            key = session._updatedKeys[i];
            if(session._componentId) {
                this._sessionCollection[session.id].components[session._componentId][key] = session._session[key];
            } else {
                this._sessionCollection[session.id].global[key] = session._session[key];
            }
        }

        for (var i = session._removedKeys.length - 1; i >= 0; i--) {
            if(session._componentId) {
                delete this._sessionCollection[session.id].components[session._componentId][session._removedKeys[i]];
            } else {
                delete this._sessionCollection[session.id].global[session._removedKeys[i]];
            }
        }

    process.nextTick(function () {
        deferred.resolve();
    });

    return deferred.promise;

};

/**
 * Destroys the session associated with the specified session id.
 *
 * @param {String} sessionId the session id
 * @return {Promise} the promise is resolved if the session was destroyed successfully,
 * else it is rejected.
 */
MemoryStore.prototype.destroy = function (sessionId) {
    var deferred = Promise.defer();

    delete this._sessionCollection[sessionId];

    process.nextTick(function () {
        deferred.resolve();
    });

    return deferred.promise;

};

module.exports = MemoryStore;

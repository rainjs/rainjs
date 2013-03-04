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

/**
 * The class creates, saves and destroys sessions. It describes the methods that have to be
 * implemented when designing a session store in order to work with the rest of RAIN middleware.
 *
 * @name BaseSessionStore
 * @class
 * @constructor
 *
 * @param {Object} cookieConfig the RAIN cookie configuration
 * @param {Object} [storeConfig] the store configuration
 */
function BaseSessionStore(cookieConfig, storeConfig) {
    this.cookie = cookieConfig;
}

/**
 * Gets the session instance associated with the session id of the current request and
 * component id. If the specified session id doesn’t exist (expired session, wrong cookie data ...)
 * then a new session id will be generated. The ``fn`` function is called with the err and session
 * objects.
 *
 * @param {Request} request
 * @param {Function} fn the callback that will be called after the session is obtained
 * @returns {BaseSessionStore} the session store
 */
BaseSessionStore.prototype.get = function (sessionId, componentId) {};

/**
 * Saves the specified session instance. Only the keys marked as dirty are saved.
 *
 * @param {Session} session the session that will be saved
 * @param {Function} fn the callback that will be called after the session was saved
 */
BaseSessionStore.prototype.save = function (sessionId) {};

/**
 * Destroys the session associated with the specified session id.
 * This method will be invoked when a user is logging out.
 *
 * @param {String} sessionId the session id
 * @param {Function} fn the callback that will be called after the session was saved
 */
BaseSessionStore.prototype.destroy = function (sessionId) {};

/**
 * Generates a new session id and creates an empty session associated with this id in the store.
 * If the session can't be created because a session with the same id already exists in the store,
 * it generates a new id until a valid id is generated.
 *
 * @param {Request} request
 * @param {Function} fn the callback that will be called after the session was created
 */
BaseSessionStore.prototype.createNewSession = function (sessionId) {};

module.exports = BaseSessionStore;

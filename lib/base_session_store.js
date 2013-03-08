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
 * @constructor
 *
 * @param {Object} [storeConfig] the store configuration
 */
function BaseSessionStore(storeConfig) {}

/**
 * Gets the session instance associated with session id and component id. Retrieves the global
 * session if component id is missing.
 *
 * @param {String} sessionId the session id
 * @param {String} [componentId] the component for which to get the session.
 * @returns {Promise} a promise that will be resolved with the session.
 */
BaseSessionStore.prototype.get = function (sessionId, componentId) {};

/**
 * Saves the specified session instance. Only the keys marked as dirty are saved.
 *
 * @param {Session} session the session that will be saved
 * @returns {Promise}
 */
BaseSessionStore.prototype.save = function (session) {};

/**
 * Destroys the session associated with the specified session id.
 *
 * @param {String} sessionId the session id
 * @param {Promise}
 */
BaseSessionStore.prototype.destroy = function (sessionId) {};

/**
 * Creates an empty session associated with the session id in the store.
 *
 * @param {String} sessionId
 * @returns {Promise}
 */
BaseSessionStore.prototype.createNewSession = function (sessionId) {};

module.exports = BaseSessionStore;

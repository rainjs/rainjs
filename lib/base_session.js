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
 * Get / set and remove session keys from / to the session store.
 * It keeps track of the updated and removed keys, information that is used by the session store
 * to make partial updates.
 *
 * @name BaseSession
 * @class
 * @constructor
 *
 * @param {Object} session the session objects for the specified component
 * @param {Object} component the component configuration
 */
function BaseSession(session, componentId) {
    this._session = session || {};
    this._componentId = componentId;
    this._isEmpty = typeof session === 'undefined';

    this._updatedKeys = [];
    this._removedKeys = [];
}

/**
 * Get the value associated with the specified key.
 *
 * @param {String} key the key
 * @returns {Object} the value
 */
BaseSession.prototype.get = function (key) {
    return this._session[key];
};

/**
 * Get the private property ``isEmpty`` of the BaseSession.
 *
 * @returns {Boolean}
 */
BaseSession.prototype.isEmpty = function () {
    return this._isEmpty;
};

/**
 * Sets a value for the specified key.
 *
 * @param {String} key the key to save
 * @param {Object} the key's value
 */
BaseSession.prototype.set = function (key, value) {
    this._session[key] = value;

    for (var i = this._updatedKeys.length; i--;) {
        if (this._updatedKeys[i] == key) {
            return;
        }
    }
    this._updatedKeys.push(key);
};

/**
 * Remove the specified key from the session.
 *
 * @param {String} key the key
 */
BaseSession.prototype.remove = function (key) {
    for (var i = this._updatedKeys.length; i--;) {
        if (this._updatedKeys[i] == key) {
            this._updatedKeys.splice(i, 1);
            break;
        }
    }

    if (typeof this._session[key] === 'undefined') {
        return;
    }

    delete this._session[key];
    this._removedKeys.push(key);
};

/**
 * Remove all keys.
 */
BaseSession.prototype.removeAll = function () {
    for (var key in this._session) {
        this._removedKeys.push(key);
    }
    this._updatedKeys = [];

    this._session = {};
};

module.exports = BaseSession;

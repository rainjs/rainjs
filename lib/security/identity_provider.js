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

var Promise = require('promised-io/promise'),
    path = require('path'),
    configuration = require('../configuration'),
    logger = require('../logging').get(),
    User = require('./user');
    IdentityProvider;


/**
 * Abstract identity provider class.
 *
 * @name IdentityProvider
 * @param {Session} session The session for which to create the identity provider instance.
 * @constructor
 */
function IdentityProvider(session) {
    this._session = session;
}

/**
 * Authenticates the user and stores the user object on the session.
 *
 * @param {String} username The username.
 * @param {String} password The password.
 * @returns {Promise} a promise that resolves with the user object
 */
IdentityProvider.prototype.login = function (username, password) {
    var promise = new Promise.Deferred(),
        self = this;

    this._authenticate(username, password).then(
        function (user) {
            self._session.user = user;
            promise.resolve(user);
        }, function (error) {
            promise.reject(error);
        }
    );

    return promise;
};

/**
 * Checks if the provided user credentials are valid and retrieves the user data.
 *
 * @param {String} username The username.
 * @param {String} password The password.
 * @returns {Promise} a promise that resolves with the user object
 * @protected
 */
IdentityProvider.prototype._authenticate = function (username, password) {};
   /* var promise = new Promise.Deferred();

    process.nextTick(function () {
        promise.resolve(new User({
            id: '1234',
            name: 'hip1@1und1.de',
            permissions: ['contracts', 'choose_contract', 'view_contract', 'user'],
            country: 'US',
            language: 'en_US'
        }));
    });

    return promise;*/

/**
 * Destroys the session.
 */
IdentityProvider.prototype.logout = function () {
    var promise = new Promise.Deferred();

    this._session.destroy(function (error) {
        if (error) {
            promise.reject(error);
            return;
        }

        promise.resolve();
    });

    return promise;
};

/**
 * Gets the user associated with the current session.
 *
 * @returns {User} the user object
 */
IdentityProvider.prototype.getUser = function () {
    var User = this._getUserClass();
    return this._user || (this._user = new User(this._session.user));
};

/**
 * Returns the actual user constructor.
 * @returns {Function} the user constructor
 * @protected
 */
IdentityProvider.prototype._getUserClass = function () {
    return User;
};

/**
 * Keeps the constructor for the identity provider implementation
 * @type Function
 */
IdentityProvider._class = null;

/**
 * Reads the path
 *
 * @param session
 * @returns {IdentityProvider}
 */
IdentityProvider.get = function (session) {
    logger.debug('IdentityProvider.get called for session id: ' + session.id);

    if (!IdentityProvider._class) {
        if (!configuration.identity || !configuration.identity.provider) {
            logger.error('No identity provider was specified in server.conf');
            throw new RainError('No identity provider was specified in server.conf');
        }

        try {
            IdentityProvider._class = require(
                path.join(process.cwd(), configuration.identity.provider));
        } catch (ex) {
            logger.error('Failed to load the identity provider', ex);
            throw new RainError('Failed to load the identity provider');
        }
    }

    return new IdentityProvider._class(session);
};

module.exports = IdentityProvider;

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
    server = require('../server'),
    logger = require('../logging').get(),
    User = require('./user');


/**
 * Abstract identity provider class. Authenticates the user and stores/retrieves the user information
 * to/from session.
 *
 * Implementations of this class should override two methods:
 *      - ``_authenticate``: provides an implementation for user authentication.
 *      - ``_getUserClass``: returns the constructor for the user class (the default implementation
 *        returns the constructor for the base user class).
 *
 * @name IdentityProvider
 * @param {Session} session the session for which to create the identity provider instance
 * @constructor
 */
function IdentityProvider(session) {
    this._session = session;
}

/**
 * Authenticates the user and stores the user object on the session.
 *
 * @param {String} username the username
 * @param {String} password the password
 * @returns {Promise} a promise that resolves with the user object
 */
IdentityProvider.prototype.login = function (username, password) {
    var deferred = new Promise.Deferred(),
        self = this,
        promise;
    if (arguments.length === 2) {
        promise = this._authenticate(username, password);
    } else {
        promise = this._authenticateToken(username);
    }
    promise.then(
        function (user) {
            if (self._session) {
                self._session.set('user', user);
                process.nextTick(function () {
                    server.sessionStore.save(self._session, function () {
                        deferred.resolve(user);
                    });
                });
                return;
            }
            deferred.resolve(user);
        }, function (error) {
            deferred.reject(error);
        }
    );

    return deferred.promise;
};

/**
 * Checks if the provided user credentials are valid and retrieves the user data.
 *
 * @param {String} username the username
 * @param {String} password the password
 * @returns {Promise} a promise that resolves with the user object
 * @protected
 */
IdentityProvider.prototype._authenticate = function (username, password) {
    throw new RainError("This method is not implemented");
};

IdentityProvider.prototype._authenticateToken = function (token) {
    throw new RainError("This method is not implemented");
};

/**
 * Destroys the session.
 * @returns {Promise} a promise that is resolved after the session is destroyed
 */
IdentityProvider.prototype.logout = function () {
    var deferred = new Promise.Deferred(),
        self = this;

    server.sessionStore.destroy(this._session.id, function (err) {
        if (err) {
            logger.error('An error occurred when destroying the session ' + self._session.id, err);
            deferred.reject(err);
            return;
        }

        deferred.resolve();
    });

    return deferred.promise;
};

/**
 * Gets the user associated with the current session.
 *
 * @returns {User} the user object
 */
IdentityProvider.prototype.getUser = function () {
    var User = this._getUserClass();
    return this._user || (this._user = new User(this._session && this._session.get('user')));
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
IdentityProvider._class = undefined;

/**
 * Reads the path of the actual identity provider implementation and creates a new instance.
 *
 * @param {Session} session the session for which to create the identity provider instance
 * @returns {IdentityProvider} an IdentityProvider instance
 */
IdentityProvider.get = function (session) {
    var provider = configuration.identity && configuration.identity.provider,
        globalSession = session && session.global;

    if (!IdentityProvider._class) {
        if (!provider) {
            logger.warn('No identity provider was specified in server.conf, falling back to dummy implementation.');
            provider = './demo_identity_provider.js';
        } else {
            provider = path.join(process.cwd(), provider);
        }

        try {
            IdentityProvider._class = require(provider);
        } catch (ex) {
            logger.error('Failed to load the identity provider', ex);
            throw new RainError('Failed to load the identity provider');
        }
    }

    return new IdentityProvider._class(globalSession);
};

module.exports = IdentityProvider;

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

var mongodb = require('mongodb'),
    util = require('util'),
    crypto = require('crypto'),
    Cookie = require('connect/lib/middleware/session/cookie'),
    BaseSessionStore = require('../base_session_store'),
    MongodbSession = require('../base_session'),
    logger = require('../logging').get();

/**
 * The base store implementation using mongodb.
 *
 * @param {Object} cookieConfig the cookie configuration
 * @param {Object} [storeConfig] the store configuration
 */
function MongodbSessionStore(cookieConfig, storeConfig) {
    BaseSessionStore.call(this, cookieConfig);
    this._initialize(storeConfig);
}

util.inherits(MongodbSessionStore, BaseSessionStore);

/**
 * Get the connection to the mongodb server.
 *
 * @param {Object} config the mongodb server configuration
 */
MongodbSessionStore.prototype._initialize = function (config) {
    var self = this;

    if (!config) {
        throw new RainError('The mongodb session store configuration is missing',
                            RainError.ERROR_PRECONDITION_FAILED);
    }
    if (!config.host) {
        throw new RainError(
            'The mongodb "host" parameter for the session store configuration is missing',
            RainError.ERROR_PRECONDITION_FAILED);
    }
    if (!config.port) {
        throw new RainError(
            'The mongodb "port" parameter for the session store configuration is missing',
            RainError.ERROR_PRECONDITION_FAILED);
    }
    if (!config.database) {
        throw new RainError(
            'The mongodb "database" parameter for the session store configuration is missing',
            RainError.ERROR_PRECONDITION_FAILED);
    }

    this._mongodbServer = new mongodb.Server(config.host, config.port, {});
    new mongodb.Db(config.database, this._mongodbServer, {}).open(function (error, client) {
        if (error) {
            throw error;
        }
        self._client = client;
        self._sessionCollection = new mongodb.Collection(client, 'sessions');

        logger.info('The connection to the mongodb session store was established.');
    });
};

/**
 * Gets the session instance associated with the session id of the current request and
 * component id. If the specified session id doesn’t exist (expired session, wrong cookie data ...)
 * then a new session id will be generated. The ``fn`` function is called with the err and session
 * objects.
 *
 * @param {Request} request
 * @param {Function} fn the callback that will be called after the session is obtained
 * @returns {MongodbSessionStore} the session store
 */
MongodbSessionStore.prototype.get = function (request, fn) {
    var self = this,
        sessionId = request.sessionId,
        fields = {},
        componentId = request.component.id,
        expires;

    if (!this._client || !this._sessionCollection) {
        logger.error('The connection to the mongodb server is not yet available.');
        fn(new RainError('The mongodb server is not yet available.'));
        return;
    }

    // The '1' in the following statement means: 'select this field'.
    fields['id'] = 1;
    fields['cookie'] = 1;
    fields['global'] = 1;
    fields['components.' + componentId] = 1;

    this._sessionCollection.findOne(
        {
            'id': sessionId
        },
        fields,
        function (err, componentSession) {
            if (err) {
                logger.error('An error occurred when getting the session from mongodb: ' +
                             (err && err.message));
                fn(err);
                return;
            }

            // Check if the session was found.
            if (!componentSession) {
                self.createNewSession(request, fn);
                return;
            }

            if (componentSession.cookie && typeof componentSession.cookie.expires == 'string') {
                expires = new Date(componentSession.cookie.expires);
            } else if (componentSession.cookie) {
                expires = componentSession.cookie.expires;
            }

            if (!expires || Date.now() < expires) {
                var session = new MongodbSession(componentSession.components[componentId],
                                                 request.component);
                session.id = sessionId;
                session.cookie = componentSession.cookie;
                session.global = new MongodbSession(componentSession.global);
                session.global.cookie = componentSession.cookie;
                session.global.id = sessionId;
                session.global.isGlobal = true;

                request.sessionId = sessionId;
                request.session = session;

                fn(null, session);
            } else {
                logger.debug('Destroying expired sessionId: ' + sessionId);
                self.destroy(sessionId, function () {
                    self.createNewSession(request, fn);
                });
            }
        }
    );

    return this;
};

/**
 * Generates a new session id and creates an empty session associated with this id in the store.
 * If the session can't be created because a session with the same id already exists in the store,
 * it generates a new id until a valid id is generated.
 *
 * @param {Request} request
 * @param {Function} fn the callback that will be called after the session was created
 */
MongodbSessionStore.prototype.createNewSession = function (request, fn) {
    if (!this._client || !this._sessionCollection) {
        logger.error('The connection to the mongodb server is not yet available.');
        fn(new RainError('The mongodb server is not yet available.'));
        return;
    }

    var cookie = new Cookie(request, this.cookie);
    if (typeof this.cookie.expires == 'string') {
        cookie.expires = new Date(this.cookie.expires);
    }

    var sessionId = crypto.randomBytes(16).toString('hex');

    this._sessionCollection.insert(
        {
            'id': sessionId,
            'cookie': cookie,
            'global': {},
            'components': {}
        },
        {
            'safe': true
        },
        function (err, objects) {
            var session = new MongodbSession({}, request.component);
            session.id = sessionId;
            session.cookie = cookie;
            session.global = new MongodbSession({});
            session.global.cookie = cookie;
            session.global.id = sessionId;
            session.global.isGlobal = true;

            request.sessionId = sessionId;
            request.session = session;
            request.sessionIsNew = true;
            fn(null, request.session);
        }
    );
};

/**
 * Saves the specified session instance. Only the keys marked as dirty are saved.
 *
 * @param {Session} session the session to save
 * @param {Function} fn the callback that will be called after the session was saved
 */
MongodbSessionStore.prototype.save = function (session, fn) {
    if (!this._client || !this._sessionCollection) {
        logger.error('The connection to the mongodb server is not yet available.');
        fn(new RainError('The mongodb server is not yet available.'));
        return;
    }

    var updatedValues = {},
        prefix = session.isGlobal ? 'global.': ('components.' + session._component.id + '.'),
        key;

    // Construct the save statement parameters: updated keys and removed keys.
    if (session._updatedKeys.length > 0) {
        var updatedFields = {};
        for (var i = session._updatedKeys.length; i--;) {
            key = session._updatedKeys[i];
            updatedFields[prefix + key] = session._session[key];
        }

        updatedFields.cookie = session.cookie;
        updatedValues['$set'] = updatedFields;
    } else {
        updatedValues['$set'] = {
            cookie: session.cookie
        };
    }

    if (session._removedKeys.length > 0) {
        var removedFields = {};
        for (var i = session._removedKeys.length; i--;) {
            removedFields[prefix + session._removedKeys[i]] = 1;
        }

        updatedValues['$unset'] = removedFields;
    }

    this._sessionCollection.update(
        {
            'id': session.id
        },
        updatedValues,
        {
            'safe': true
        },
        function (err) {
            if (err) {
                logger.error('Could not update the session for ' + prefix + ': ' + err);
            }

            fn && fn(err);
        }
    );
};

/**
 * Destroys the session associated with the specified session id.
 * This method will be invoked when a user is logging out.
 *
 * @param {String} sessionId the session id
 * @param {Function} fn the callback that will be called after the session was saved
 */
MongodbSessionStore.prototype.destroy = function (sessionId, fn) {
    if (!this._client || !this._sessionCollection) {
        logger.error('The connection to the mongodb server is not yet available.');
        fn(new RainError('The mongodb server is not yet available.'));
        return;
    }

    this._sessionCollection.remove(
        {
            'id': sessionId
        },
        {
            'safe': true
        },
        function (err, numberOfRemovedDocs) {
            if (err) {
                logger.error('Could not remove the session ' + sessionId + ': ' + err);
            }

            fn && fn(err);
        }
    );
};

/**
 * Close the connection to the mongodb server.
 */
MongodbSessionStore.prototype.shutdown = function () {
    try {
        logger.info('Closing the connection to the mongodb server ...');
        this._mongodbServer.close();
    } catch (err) {
        logger.error('The connection to the mongodb server could not closed.', err);
    }
};

module.exports = MongodbSessionStore;

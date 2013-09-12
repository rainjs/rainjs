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
    configuration = require('../../configuration'),
    util = require('util'),
    crypto = require('crypto'),
    Cookie = require('connect/lib/middleware/session/cookie'),
    BaseSessionStore = require('../base_session_store'),
    MongodbSession = require('../base_session'),
    logger = require('../../logging').get(),
    Promise = require('promised-io/promise');

/**
 * Session store implementation using mongodb.
 *
 * @param {Object} [storeConfig] the store configuration
 */
function MongodbSessionStore(storeConfig) {
    BaseSessionStore.call(this, storeConfig);
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
    new mongodb.Db(config.database, this._mongodbServer, {w:1}).open(function (error, client) {
        if (error) {
            throw error;
        }
        self._client = client;
        self._sessionCollection = new mongodb.Collection(client, 'sessions');
        self._sessionCollection.ensureIndex({"lastModified": 1},
            {expireAfterSeconds: configuration.sessionMaxAge}, function(err) {
            if(err) {
                throw error;
            }
        });

        logger.info('The connection to the mongodb session store was established.');
    });
};

/**
 * Gets the session instance associated with session id and component id. If component id is
 * missing then the global session is retrieved.
 *
 * @param {String} sessionId - the session id
 * @param {String} [componentId] - the component's id
 * @returns {Promise}
 */
MongodbSessionStore.prototype.get = function (sessionId, componentId) {
    var deferred = Promise.defer(),
        fields = {}, session;

    if (!this._client || !this._sessionCollection) {
        logger.error('The connection to the mongodb server is not yet available.');
        process.nextTick(function () {
            deferred.reject(new RainError('The mongodb server is not yet available.'));
        });
        return deferred.promise;
    }

    // The '1' in the following statement means: 'select this field'.
    fields['id'] = 1;
    fields['global'] = 1;
    if (componentId) {
        fields['components.' + componentId] = 1;
    }

    this._sessionCollection.findOne(
        {
            '_id': sessionId
        },
        fields,
        function (err, sessionData) {
            if (err) {
                logger.error('An error occurred when getting the session from mongodb.', err);
                deferred.reject(err);
                return;
            }

            // Check if the session was found.
            if (!sessionData) {
                if(componentId) {
                    session = new MongodbSession(undefined, componentId);
                } else {
                    session = new MongodbSession();
                }
                session.id = sessionId;

                deferred.resolve(session);
                return;
            }

            if(componentId) {
                session = new MongodbSession(sessionData.components[componentId], componentId);
            } else {
                session = new MongodbSession(sessionData.global);
            }

            session.id = sessionId;

            deferred.resolve(session);
        }
    );

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
MongodbSessionStore.prototype.createNewSession = function (sessionId) {
    var deferred = Promise.defer();

    if (!this._client || !this._sessionCollection) {
        logger.error('The connection to the mongodb server is not yet available.');
        process.nextTick(function () {
            deferred.reject(new RainError('The mongodb server is not yet available.'));
        });
        return deferred.promise;
    }

    this._sessionCollection.insert(
        {
            '_id': sessionId,
            'id': sessionId,
            'global': {},
            'components': {},
            'lastModified': new Date(),
            'safe': true
        },
        {
            'safe': true
        },
        function (err, objects) {
            if (err) {
                deferred.reject(err);
            }

            var session = new MongodbSession();
            session.id = sessionId;

            deferred.resolve(session);
        }
    );
    return deferred.promise;
};

/**
 * Saves the specified session instance. Only the keys marked as dirty are saved.
 *
 * @param {Session} session the session to save
 * @param {Promise} returns a rejected promise if error, else the promise is resolved.
 */
MongodbSessionStore.prototype.save = function (session) {
    var deferred = Promise.defer();

    if (!this._client || !this._sessionCollection) {
        logger.error('The connection to the mongodb server is not yet available.');
        process.nextTick(function () {
            deferred.reject(new RainError('The mongodb server is not yet available.'));
        });
        return deferred.promise;
    }

    var updatedValues = {},
        prefix = session._componentId ? ('components.' + session._componentId + '.') : 'global.',
        key;

    // Construct the save statement parameters: updated keys and removed keys.
    if (session._updatedKeys.length > 0) {
        var updatedFields = {};
        for (var i = session._updatedKeys.length; i--;) {
            key = session._updatedKeys[i];
            updatedFields[prefix + key] = session._session[key];
        }

        updatedValues['$set'] = updatedFields;
    }

    if(!updatedValues['$set']) {
        updatedValues['$set'] = {};
    }

    updatedValues['$set']['lastModified']= new Date();

    if (session._removedKeys.length > 0) {
        var removedFields = {};
        for (var i = session._removedKeys.length; i--;) {
            removedFields[prefix + session._removedKeys[i]] = 1;
        }

        updatedValues['$unset'] = removedFields;
    }

    if (updatedValues['$set'] || updatedValues['$unset']) {
        this._sessionCollection.update(
            {
                '_id': session.id
            },
            updatedValues,
            {
                'safe': true
            },
            function (err) {
                if (err) {
                    logger.error('Could not update the session for ' + prefix, err);
                    deferred.reject(err);
                }

                deferred.resolve();
            }
        );
    } else {
        process.nextTick(function () {
            deferred.resolve();
        });
    }

    return deferred.promise;
};

/**
 * Destroys the session associated with the specified session id.
 *
 * @param {String} sessionId the session id
 * @return {Promise} the promise is resolved if the session was destroyed successfully,
 * else it is rejected.
 */
MongodbSessionStore.prototype.destroy = function (sessionId) {
    var deferred = Promise.defer();

    if (!this._client || !this._sessionCollection) {
        logger.error('The connection to the mongodb server is not yet available.');
        process.nextTick(function () {
            deferred.reject(new RainError('The mongodb server is not yet available.'));
        });
        return deferred.promise;
    }

    this._sessionCollection.remove(
        {
            '_id': sessionId
        },
        {
            'safe': true
        },
        function (err, numberOfRemovedDocs) {
            if (err) {
                logger.error('Could not remove the session ' + sessionId, err);
                deferred.reject(err);
            }

            deferred.resolve();
        }
    );
    return deferred.promise;
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

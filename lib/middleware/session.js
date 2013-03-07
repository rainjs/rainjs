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

var utils = require('connect/lib/utils'),
    util = require('util'),
    Cookie = require('connect/lib/middleware/session/cookie'),
    crypto = require('crypto'),
    Promise = require('promised-io/promise'),
    logger = require('../logging').get();


var SESSION_ROUTES = ['controller', 'view'];

/**
 * Creates a new session object.
 *
 * @name Session
 * @constructor
 *
 * @param {Object} options the session options
 */
function Session(options) {
    this._store = options.store;
    this._key = options.key || 'rain.sid';
    this._cookie = options.cookie || {};
}

/**
 * Handle function for the session middleware.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Function} next callback passed by connect that execute the next middleware when called
 */
Session.prototype.handle = function (request, response, next) {
    var self = this;

    if (request.globalSession || !this._needsSession(request)) {
        next();
        return;
    }

    Object.defineProperty(request, 'session', {
        get: function () {
            logger.error('The request.session property should not be used', new Error('session'));
            return;
        }
    });

    request.sessionStore = this._store;
    request.sessionId = request.signedCookies[this._key];

    var pause = utils.pause(request);

    this._ensureSession(request).then(function () {
        next();
        pause.resume();
    }, function (error) {
        next(error);
        pause.resume();
    });

    response.on('header', function () {
        self._setCookie(request, response);
    });

    this._decorateEnd(request, response);
};

/**
 * Determines if the session is needed for the current request.
 *
 * @param {Request} request the request object
 * @returns {Boolean}
 */
Session.prototype._needsSession = function (request) {
    if (request.rainRoute){
        return SESSION_ROUTES.indexOf(request.rainRoute.routeName) !== -1;
    }

    return false;
};

/**
 * Retrieves the global session for the current user or creates a new session if the sessionId is
 * missing or it doesn't have an associated session.
 *
 * @param {Request} request the request object
 * @returns {Promise}
 */
Session.prototype._ensureSession = function (request) {
    var deferred = Promise.defer(),
        self = this;

    if (!request.sessionId) {
        request.sessionId = this._generateSessionId();
        request.sessionIsNew = true;

        this._store.createNewSession(request.sessionId).then(function (session) {
            request.globalSession = session;
            logger.debug(util.format('Created a new session: %s', request.sessionId));
            deferred.resolve();
        }, function (error) {
            logger.error(util.format('Failed to create a new session: %s', request.sessionId),
                    error);
            deferred.reject(error);
        });
    } else {
        this._store.get(request.sessionId).then(function (session) {
            // generate a new session id if a session doesn't exist for the id passed by user
            if (session.isEmpty()) {
                logger.debug(util.format('A session doesn\'t exist for: %s', request.sessionId));
                request.sessionId = null;
                self._ensureSession(request).then(deferred.resolve, deferred.reject);
                return;
            }

            request.globalSession = session;
            logger.debug(util.format('Retrieved the global session for: %s', request.sessionId));
            deferred.resolve();
        }, function (error) {
            logger.error(util.format('Failed to retrieve global session for: :%s',
                request.sessionId), error);
            deferred.reject(error);
        });
    }

    return deferred.promise;
};

/**
 * Generates a new session id.
 * @returns {String}
 */
Session.prototype._generateSessionId = function () {
    return crypto.randomBytes(16).toString('hex');
};

/**
 * Ensures that the cookie is set in the response headers.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
Session.prototype._setCookie = function (request, response) {
    if (!request.globalSession) {
        return;
    }

    var cookie = new Cookie(request, this._cookie),
        proto = (request.headers['x-forwarded-proto'] || '').toLowerCase(),
        isSecured = request.connection.encrypted || (proto === 'https');

    // Browser-session cookies only set-cookie once.
    if (cookie.expires === null && !request.sessionIsNew) {
        return;
    }

    // Only send secure cookies via https.
    if (cookie.secure && !isSecured) {
        return;
    }

    var val = cookie.serialize(this._key, request.sessionId);
    logger.debug(util.format('Setting cookie: %s', val));
    response.setHeader('Set-Cookie', val);
};

/**
 * Decorates response.end() in order to save the session when the request finishes.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
Session.prototype._decorateEnd = function (request, response) {
    var end = response.end,
        self = this;

    response.end = function (data, encoding) {
        response.end = end;

        if (!request.globalSession) {
            response.end(data, encoding);
            return;
        }

        self._store.save(request.globalSession).then(function () {
            logger.debug(util.format('Saved global session for: %s', request.sessionId));
            response.end(data, encoding);
        }, function (error) {
            logger.error(util.format('Failed to save global session for: %s', request.sessionId),
                    error);
            response.end(data, encoding);
        });
    };
};

/**
 * Holds the Session instance.
 *
 * @type {Session}
 */
Session._instance = null;

/**
 * Get the session middleware function.
 *
 * @param {Object} options the session options
 * @returns {Function} the middleware handle function
 */
Session.getHandle = function (options) {
    if (!Session._instance) {
        Session._instance = new Session(options);
    }

    return Session._instance.handle.bind(Session._instance);
};

module.exports = Session;

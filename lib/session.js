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

var connect = require('connect'),
    utils = require('connect/lib/utils'),
    parse = require('url').parse,
    crc16 = require('crc').crc16,
    Promise = require('promised-io/promise'),
    crypto = require('crypto');

/**
 * Holds the Session instance.
 *
 * @type {Session}
 * @private
 */
var instance;

/**
 * Create a new session object.
 *
 * @param {Object} options the session options
 */
function Session(options) {
    this._store = options.store;
    this._key = options.key || 'rain.sid';
    this._trustProxy = options.proxy;
}

/**
 * Handle function for the session middleware.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Function} next callback passed by connect that execute the next middleware when called
 */
Session.prototype.handle = function (request, response, next) {
    var self = instance;

    // self-awareness
    if (request.session) {
        return next();
    }

    // Retrieve the session only for views and server-side controllers.
    if (request.rainRoute) {
        var routeName = request.rainRoute.routeName;
        if (routeName !== 'controller' && routeName !== 'view' && routeName !== 'locale') {
            return next();
        }
    }

    // Expose the store.
    request.sessionStore = self._store;

    // Set-cookie.
    response.on('header', function () {
        if (!request.session) {
            return;
        }

        var cookie = request.session.cookie,
            proto = (request.headers['x-forwarded-proto'] || '').toLowerCase(),
            tls = request.connection.encrypted || (self._trustProxy && 'https' == proto),
            secured = cookie.secure && tls;

        // Browser-session cookies only set-cookie once.
        if (cookie.expires === null && !request.sessionIsNew) {
            return;
        }

        // Only send secure cookies via https.
        if (cookie.secure && !secured) {
            return;
        }

        var val = cookie.serialize(self._key, request.sessionId);
        response.setHeader('Set-Cookie', val);
    });

    // Proxy end() to commit the session.
    var end = response.end;
    response.end = function (data, encoding) {
        response.end = end;

        if (!request.session) {
            return response.end(data, encoding);
        }

        self._store.save(request.session, function () {
            response.end(data, encoding);
        });
    };

    // Generate the session.
    function generate(next) {
        self._store.createNewSession(request, next);
    }

    // Get the sessionId from the cookie.
    request.sessionId = request.signedCookies[self._key];

    // Generate a session if the browser doesn't send a sessionId.
    if (!request.sessionId) {
        generate(next);
        return;
    }

    // Generate the session object.
    var pause = utils.pause(request);
    self._store.get(request, function (err, sess) {
        // Proxy to resume() events.
        var _next = next;
        next = function (err) {
            _next(err);
            pause.resume();
        };

        if (err) {
            next(err);
        } else {
            next();
        }
    });
};

/**
 * Get the session middleware function.
 *
 * @param {Object} options the session options
 * @returns {Function} the middleware handle function
 */
Session.getHandle = function (options) {
    if (!instance) {
        instance = new Session(options);
    }

    return instance.handle;
};

module.exports = Session;

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
    server = require('./server'),
    logging = require('./logging'),
    logger = logging.get(),
    Promise = require('promised-io/promise'),
    Environment = require('./environment'),
    Translation = require('./translation'),
    IdentityProvider = require('./security').IdentityProvider,
    config = require('./configuration'),
    util = require('util');

var handlers = {},
    defer = Promise.defer,
    all = Promise.all,
    when = Promise.when,
    seq = Promise.seq;

/**
 * Register a socket handler to a socket.io channel.
 *
 * @param {String} channel the socket.io channel to register to
 * @param {Function|String} handler the handler for the connection event
 * @param {Object} component the component that registers the channel
 */
function register(channel, handler, component) {
    if (handlers[channel]) {
        handlers[channel].push(handler);
        return;
    }

    handlers[channel] = [handler];

    server.socket.of(channel).authorization(function (handshake, callback) {
        var sessionId = getSid(handshake);

        if (!sessionId) {
            logger.warn('The session id is not set for this socket connection.');
            callback(null, false);
            return;
        }

        seq([
            function () {
                if (!handshake.globalSession && !handshake.globalSessionPromise) {
                    handshake.globalSessionPromise = getSession(sessionId);
                }

                return handshake.globalSessionPromise;
            },
            function (globalSession) {
                handshake.globalSessionPromise = null;
                if (!handshake.globalSession) {
                    handshake.globalSession = globalSession;
                    handshake.environment = new Environment(globalSession);
                    handshake.idp = IdentityProvider.get(globalSession);
                    handshake.user = handshake.idp.getUser();
                }

                if (component.useSession) {
                    return getSession(sessionId, component);
                }
            }
        ]).then(function (session) {
            // this is ok because the connection event is triggered synchronous when the callback
            // is called. ``handshake`` is the same reference for all channels
            handshake.session = session;
            callback(null, true);
        }, function (error) {
            logger.error(util.format('Could not get session for %s', component), error);
            callback(error, false);
        });
    }).on('connection', function (socket) {
        socket.sessionId = getSid(socket.handshake);
        socket.component = component;
        socket.environment = socket.handshake.environment;
        socket.idp = socket.handshake.idp;
        socket.user = socket.handshake.user;
        socket.globalSession = socket.handshake.globalSession;

        if (component.useSession) {
            socket.session = socket.handshake.session;
        }

        modifyOn(socket);

        var results = [];

        for (var i = handlers[channel].length; i--;) {
            var handler = getHandler(handlers[channel][i], socket);
            results.push(handler(socket));
        }

        all(results).then(function () {
            if (component.useSession) {
                server.sessionStore.save(socket.session).then(function () {
                    // nothing to do here
                }, function () {
                    logger.error(util.format('Failed to save session for websocket channel: %s',
                        channel));
                });
            }
        }, function (error) {
            logger.error('An error occurred while running the connection handler for ' +
                         'component: ' + component.id + ':' + component.version, error);
        });
    });
}

/**
 * Returns the function that handles the connection event for a channel. The handler can be
 * either a function or a path. For paths it requires the module using requireWithContext.
 *
 * @param {Function|String} handler the handler function or a module path
 * @param {Socket} socket the socket for which the handler will be called *
 * @returns {Function} the connection event handler
 */
function getHandler(handler, socket) {
    if (typeof handler === 'function') {
        return handler;
    }

    var context = Translation.get().generateContext(socket.component, socket.environment.language);
    context.logger = logging.get(socket.component);

    var module = requireWithContext(handler, context);
    return module.handle;
}

/**
 * Gets the session for the specified session id and component.
 *
 * @param {String} sessionId the session id
 * @param {Object} component the component that registers the channel
 * @returns {Deferred} a promise that resolves with the session
 */
function getSession(sessionId, component) {
    var deferred = defer();
    server.sessionStore.get(sessionId, component ? component.id : void 0).then(
        function (session) {
            session.id = sessionId;
            deferred.resolve(session);
        },
        function (err) {
            logger.warn('The session ' + sessionId + ' could not be found: ' + err);
            deferred.reject(err);
            return;
    });

    return deferred.promise;
}

/**
 * Modifies the on method of the socket in order to get the session before executing the
 * handler for the event.
 *
 * @param {Socket} socket the socket to be modified
 */
function modifyOn(socket) {
    var on = socket.on.bind(socket);

    socket.on = function (eventName, callback) {
        on(eventName, function () {
            var args = Array.prototype.slice.call(arguments);

            seq([
                 function () {
                     if (socket.component.useSession) {
                         return  getSession(socket.sessionId, socket.component);
                     }
                 },
                 function (session) {
                     socket.session = session;

                     return callback.apply(null, args);
                 }
                 ]).then(
                     function (){
                         if (socket.component.useSession) {
                             server.sessionStore.save(socket.session).then(function () {
                                 // nothing to do here
                             }, function () {
                                 logger.error(util.format(
                                     'Failed to save session for websocket event: %s (%s;%s)',
                                     eventName, socket.component.id, socket.component.version));
                             });
                         }
                     },
                     function () {
                         logger.error('An error occurred while running an event handler for ' +
                                 socket.component.id + ':' + socket.component.version, error);
                     }
                 );
        });
    };
}

/**
 * Get the session id from the Rain cookie passed on the session.
 *
 * @param {Object} handshake the socket handshake to extract the session from
 * @returns {String} sid the session id
 */
function getSid(handshake) {
    if (!handshake.headers.cookie) {
        return;
    }

    var cookies = connect.utils.parseCookie(handshake.headers.cookie);
    var sid = connect.utils.parseSignedCookies(cookies, config.cookieSecret)['rain.sid'];

    return sid;
}

module.exports = {
    register: register
};

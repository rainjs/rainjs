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
    moduleLoader = require('./module_loader').get(),
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
                return server.globalSessionSync.wait(sessionId);
            },
            function () {
                if (!handshake.globalSession && !handshake.globalSessionPromise) {
                    handshake.globalSessionPromise = getSession(sessionId);
                }

                return handshake.globalSessionPromise;
            },
            function (globalSession) {
                if(globalSession && globalSession.isEmpty()) {
                    var deferred = defer();
                    process.nextTick(function () {
                        deferred.reject(new RainError('Global Session is empty',
                            RainError.ERROR_HTTP));
                    });
                    return deferred.promise;
                }

                handshake.globalSessionPromise = null;
                if (!handshake.globalSession) {
                    extendHandshake(handshake, globalSession);
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
            logger.error(util.format('Could not get session for %s', component.id), error);
            callback(error, false);
        });
    }).on('connection', function (socket) {
        extendSocket(socket, component);
        modifyOn(socket);
        invokeSocketHandlers(socket, component, channel);
    });
}

/**
 * Adds globalSession, environment, idp and user on the handshake object.
 *
 * @param {Object} handshake the handshake for the current socket
 * @param {Session} globalSession the globalSession
 */
function extendHandshake(handshake, globalSession) {
    // handshake is undefined when the socket is disconnected
    if (!handshake) {
        return;
    }

    handshake.globalSession = globalSession;
    handshake.environment = new Environment(globalSession);
    handshake.idp = IdentityProvider.get(globalSession);
    handshake.user = handshake.idp.getUser();
}

/**
 * Adds sessionId, component, environment, idp, user, globalSession and session on the socket.
 *
 * @param {Socket} socket the socket to be extended
 * @param {Object} component the component that registers the channel
 */
function extendSocket(socket, component) {
    var handshake = socket.handshake;

    socket.sessionId = getSid(handshake);
    socket.component = component;

    Object.defineProperty(socket, 'environment', {
        get: function () {
            return handshake.environment;
        },
        configurable: true
    });

    Object.defineProperty(socket, 'idp', {
        get: function () {
            return handshake.idp;
        },
        configurable: true
    });

    Object.defineProperty(socket, 'user', {
        get: function () {
            return handshake.user;
        },
        configurable: true
    });

    Object.defineProperty(socket, 'globalSession', {
        get: function () {
            return handshake.globalSession;
        },
        configurable: true
    });

    if (component.useSession) {
        socket.session = handshake.session;
    }
}

/**
 * Invokes the handlers for the specified channel.
 *
 * @param {Socket} socket the socket to invoke the handlers for
 * @param {Object} component the component to which the channel belongs
 * @param {String} channel the channel name
 */
function invokeSocketHandlers(socket, component, channel) {
    var results = [];

    try {
        for (var i = handlers[channel].length; i--;) {
            var handler = getHandler(handlers[channel][i], socket);
            results.push(handler(socket));
        }
    } catch (e) {
        logger.error('An error occurred while running the connection handlers for channel: ' +
            channel, e);
        return;
    }

    seq([
        function () {
            return all(results);
        },
        function () {
            if (component.useSession) {
                return server.sessionStore.save(socket.session);
            }
        },
        function () {
            return updateGlobalSession(socket);
        }
    ]).then(function () {
            // nothing to do here
        }, function (error) {
            logger.error('An error occurred while running the connection handlers for channel: ' +
                channel, error);
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

    var module = moduleLoader.requireWithContext(handler, socket.component,
            socket.environment.language);

    return module.handle;
}

/**
 * Gets the session for the specified session id and component.
 *
 * @param {String} sessionId the session id
 * @param {Object} component the component that registers the channel
 * @returns {promise} a promise that resolves with the session
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
            var args = Array.prototype.slice.call(arguments), ackData, ack;

            if (args.length > 0 && typeof args[args.length - 1] === 'function') {
                ack = args[args.length - 1];
                args.pop();
            }

            seq([
                function () {
                    if (socket.component.useSession) {
                        return getSession(socket.sessionId, socket.component);
                    }
                },
                function (session) {
                    socket.session = session;

                    try {
                        return callback.apply(null, args);
                    } catch (e) {
                        var deferred = defer();
                        process.nextTick(function () {
                            deferred.reject(e);
                        });
                        return deferred.promise;
                    }
                }, function (data) {
                    ackData = data;
                    if (socket.component.useSession) {
                        return server.sessionStore.save(socket.session);
                    }
                }, function () {
                    return updateGlobalSession(socket);
                }
            ]).then(function () {
                ack && ack(null, ackData);
            }, function (error) {
                ack && ack(error, ackData);
                logger.error('An error occurred while running an event handler for ' +
                         socket.component.id + ':' + socket.component.version, error);
            });
        });
    };
}

/**
 * Saves the global session and updates it on the handshake object if it was changed.
 *
 * @param {Socket} socket the socket for which to save the global session
 */
function updateGlobalSession(socket) {
    // handshake is undefined when the socket is disconnected
    if (!socket.handshake) {
        return;
    }

    socket.idp.updateUser();

    if (!socket.globalSession.isDirty()) {
        return;
    }

    return seq([
        function () {
            return server.sessionStore.save(socket.globalSession);
        },
        function () {
            return getSession(socket.sessionId);
        },
        function (globalSession) {
            extendHandshake(socket.handshake, globalSession);
        }
    ]);
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

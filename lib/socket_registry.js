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
    logger = require('./logging').get(),
    Promise = require('promised-io/promise');

var handlers = {},
    defer = Promise.defer;

/**
 * Register a socket handler to a socket.io channel.
 *
 * @param {String} channel the socket.io channel to register to
 * @param {Function} handler the handler for the connection event
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

        getSession(sessionId, component).then(
            function (session) {
                handshake.session = session;
                callback(null, true);
            },
            function (error) {
                callback(error, false);
            }
        );
    }).on('connection', function (socket) {
        socket.sessionId = getSid(socket.handshake);;
        socket.component = component;
        socket.session = socket.handshake.session;

        modifyOn(socket);

        // save the session after all the handlers call end
        var count = 0,
            len = handlers[channel].length,
            end = function () {
                count++;
                if (count === len) {
                    server.sessionStore.save(socket.session);
                }
            };

        for (var i = len; i--;) {
            handlers[channel][i](socket, end);
        }
    });
}

/**
 * Gets the session for the specified session id and component.
 *
 * @param {String} sessionId the session id
 * @param {Object} component the component that registers the channel
 * @returns {Deferred} a promise that resolves with the session
 */
function getSession (sessionId, component) {
    var deferred = defer(),
        request = {
        sessionId: sessionId,
        component: component
    };

    server.sessionStore.get(request, function (err, session) {
        if (err) {
            logger.warn('The session ' + request.sessionId + ' could not be found: ' + err);
            deferred.reject(err);
            return;
        }

        session.id = request.sessionId;
        deferred.resolve(session);
    });

    return deferred.promise;
}

/**
 * Modifies the on method of the socket in order to get the session before executing the
 * handler for the event.
 *
 * @param {Socket} socket the socket to be modified
 */
function modifyOn (socket) {
    var on = socket.on.bind(socket);

    socket.on = function (eventName, callback) {
        on(eventName, function () {
            var args = Array.prototype.slice.call(arguments);

            getSession(socket.sessionId, socket.component).then(
                function (session) {
                    var end = function () { server.sessionStore.save(session); };

                    socket.session = session;
                    args.push(end);
                    callback.apply(null, args);
                },
                function (error) {
                    socket.disconnect();
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
    var sid = connect.utils.parseSignedCookies(cookies, 'let it rain ;)')['rain.sid'];

    return sid;
}

module.exports = {
    register: register
};

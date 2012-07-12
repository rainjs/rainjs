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
    connect = require('connect'),
    server = require('./server'),
    Translation = require('./translation'),
    Environment = require('./environment');

var handlers = {};

/**
 * Register a socket handler to a socket.io channel.
 *
 * @param {String} channel the socket.io channel to register to
 * @param {String} handlerPath the handler file path or the handle function
 * @param {String} component the component configuration
 */
function register(channel, handler, component) {
    if (handlers[channel]) {
        handlers[channel].push(handler);
        return;
    }

    handlers[channel] = [handler];

    server.socket.of(channel).on('connection', function (socket) {
        var promise = new Promise.Deferred();
        var sid = getSid(socket);

        if (sid) {
            server.sessionStore.get(sid, function (err, session) {
                if (err) {
                    promise.reject(err);
                    return;
                }

                socket.session = session;
                promise.resolve(socket);
            });
        } else {
            promise.reject(new RainError('The session id is not set for this socket connection.',
                RainError.ERROR_SOCKET));
        }

        socket.on('disconnect', function () {
            server.sessionStore.set(sid, socket.session);
        });

        promise.then(
            function (socket) {
                var environment = new Environment(socket.session);
                for (var i = handlers[channel].length; i--;) {
                    if (typeof handlers[channel][i] === 'function') {
                        handlers[channel][i](socket);
                    } else {
                        var handler = requireWithContext(handlers[channel][i],
                                        Translation.get().generateContext(component,
                                                                          environment.language));
                        handler.handle(socket);
                    }
                }
            },
            function (err) {
                console.log(err.stack);
                socket.disconnect();
            }
        );
    });
}

/**
 * Get the session id from the Rain cookie passed on the session.
 *
 * @param {Socket} socket the socket to extract the session from
 * @returns {String} sid the session id
 */
function getSid(socket) {
    if (!socket.handshake.headers.cookie) {
        return;
    }

    var cookies = connect.utils.parseCookie(socket.handshake.headers.cookie);
    var sid = connect.utils.parseSignedCookies(cookies, 'let it rain ;)')['rain.sid'];

    return sid;
}

module.exports = {
    register: register
};

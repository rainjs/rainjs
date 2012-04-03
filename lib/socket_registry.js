"use strict";

var Promise = require('promised-io/promise');
var connect = require('connect');
var server = require('./server');

var handlers = {};

/**
 * Register a socket handler to a socket.io channel.
 *
 * @param {String} channel the socket.io channel to register to
 * @param {Function} handler the handler for the connection event
 */
function register(channel, handler) {
    if (handlers[channel]) {
        handlers[channel].push(handler);
        return;
    }

    handlers[channel] = [handler];

    server.socket.of(channel).on('connection', function (socket) {
        var promise = Promise.defer();
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
            promise.resolve(socket);
        }

        socket.on('disconnect', function () {
            server.sessionStore.set(sid, socket.session);
        });

        promise.then(
            function () {
                for (var i = handlers.length; i--;) {
                    handlers[channel][i](socket);
                }
            },
            function (err) {
                throw new RainError(err);
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
    var cookies = connect.utils.parseCookie(socket.handshake.headers.cookie);
    var sid = connect.utils.parseSignedCookies(cookies, 'let it rain ;)')['rain.sid'];

    return sid;
}

module.exports = {
    register: register
};

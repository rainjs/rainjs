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

/**
 * Register handlers for core web socket events.
 *
 * @name SocketHandlers
 * @namespace
 */

var socketRegistry = require('./socket_registry'),
    server = require('./server'),
    logger = require('./logging').get();

/**
 * Registers handlers for the /core channel. This is not the complete list of registered handlers.
 * Complex events like ``render`` or ``request_intent`` have the handlers in their own files.
 *
 * @memberOf SocketHandlers
 */
function register() {
    socketRegistry.register('/core', changeLanguage, {
        id: 'core'
    });

    socketRegistry.register('/core/logging', function (socket) {
        socket.on('log', log);
    }, {
        id: 'core'
    });
}

/**
 * Listens to the change language event. After changing the language you should refresh the page
 * in order to see the components displayed with the new language.
 *
 * The following example shows how the language can be changed on client-side::
 *
 *      var socket = Sockets.getSocket('/core');
 *
 *      // ensure that the socket was opened before calling emit
 *      socket.emit('change_language', 'de_DE', function (error) {
 *          window.location.href = window.location.href;
 *      });
 *
 * @param {Socket} socket the web socket object
 * @memberOf SocketHandlers
 */
function changeLanguage(socket) {
    socket.on('change_language', function (locale, acknowledge) {
        if (typeof locale === 'string' && locale.length > 4) {
            socket.handshake.globalSession.set('userLanguage', locale);
            server.sessionStore.save(socket.handshake.globalSession)
                               .then(acknowledge, acknowledge);
        } else {
            acknowledge(new RainError('The language parameter is invalid.',
                                      RainError.ERROR_PRECONDITION_FAILED));
        }
    });
}

/**
 * Logs an event received from the client.
 *
 * @param {Object} event the event to be logged
 * @param {String} event.level the log level of the event
 * @param {String} event.message the log message
 * @param {String} event.error the log error
 */
function log(event) {
    logger._log(event.level, event.message, event.error, 'CLIENT');
}

module.exports = {
    register: register
};

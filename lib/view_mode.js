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

var server = require('./server'),
    configuration = require('./configuration'),
    ViewModeUtils = require('./view_mode_utils'),
    IdentityProvider = require('./security').IdentityProvider;

/**
 * Listens to the change view mode event. After changing the view mode the page should be refreshed
 * in order to see the components displayed with the new state.
 *
 * This event is registered only if the server configuration file enables the view modes.
 *
 * The following example shows how the view mode can be changed on client-side::
 *
 *      var socket = Sockets.getSocket('/core');
 *
 *      // ensure that the socket was opened before calling emit
 *      socket.emit('change_view_mode', 'edit', function (error) {
 *          window.location.href = window.location.href;
 *      });
 *
 * @param {Socket} socket the web socket object
 */
function changeViewMode(socket) {
    if (!configuration.viewModes || !configuration.viewModes.modes ||
        configuration.viewModes.modes.length <= 1) {
        return;
    }

    socket.on('change_view_mode', function (mode, acknowledge) {
        var request = {
            sessionId: socket.sessionId,
            component: {
                id: 'core'
            },
            sessionStore: server.sessionStore
        };

        server.sessionStore.get(request, function (err, session) {
            if (err) {
                logger.error('Couldn\'t get the session ' + session.id + ': ', err);
                acknowledge(new RainError('Couldn\'t get the session.', RainError.ERROR_HTTP));
                return;
            }

            if (!validateChange(session, mode)) {
                acknowledge(new RainError('You aren\'t authorized to change the view mode.',
                                          RainError.ERROR_AUTHORIZATION));
                return;
            }

            session.global.set('viewMode', mode);
            server.sessionStore.save(session.global, acknowledge);
        });
    });
}

/**
 * Check if the current user has the permissions to change the view mode.
 *
 * @param {Session} session the user session
 * @param {String} mode the selected view mode
 * @returns {Boolean} true if the view mode can be changed
 */
function validateChange(session, mode) {
    var idp = IdentityProvider.get(session),
        user = idp.getUser();

    if (!user || !user.permissions) {
        return false;
    }

    var modeConfiguration = ViewModeUtils.getViewModeServerConfiguration(mode);

    if (!modeConfiguration) {
        return false;
    }

    var neededPermissions = modeConfiguration.permissions || [];

    return user.hasPermissions(neededPermissions);
}

module.exports = {
    change: changeViewMode
};

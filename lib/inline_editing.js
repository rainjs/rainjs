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
 * Listens to the save translation event. When the event is received a new inline translation is
 * saved on the current user's session.
 *
 * @param {Socket} socket the web socket object
 */
function saveTranslation(socket) {
    if (!configuration.viewModes || !configuration.viewModes.modes ||
        configuration.viewModes.modes.length <= 1) {
        return;
    }

    socket.on('save_translation', function (data, acknowledge) {
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

            if (!validateSave(session)) {
                acknowledge(new RainError('You aren\'t authorized to change the view mode.',
                                          RainError.ERROR_AUTHORIZATION));
                return;
            }

            var globalSession = session.global,
                translations = globalSession.get('translations') || {};

            var moduleId = data.moduleId,
                language = data.language;

            if (!translations[moduleId]) {
                translations[moduleId] = {};
            }

            if (!translations[moduleId][language]) {
                translations[moduleId][language] = [];
            }

            var messages = translations[moduleId][language],
                msgId = data.msgId,
                message;

            for (var i = 0, len = messages.length; i < len; i++) {
                if (messages[i][0] === msgId) {
                    message = messages[i];
                    break;
                }
            }

            if (message) {
                message[1] = data.translations;
            } else {
                translations[moduleId][language].push([msgId, data.translations]);
            }

            globalSession.set('translations', translations);

            server.sessionStore.save(globalSession, acknowledge);
        });
    });
}

/**
 * Listens to the remove translations event. When the event is received the inline translations
 * for the current user sessions are removed.
 *
 * @param {Socket} socket the web socket object
 */
function removeTranslations(socket) {
    if (!configuration.viewModes || !configuration.viewModes.modes ||
        configuration.viewModes.modes.length <= 1) {
        return;
    }

    socket.on('remove_translations', function (acknowledge) {
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

            if (!validateSave(session)) {
                acknowledge(new RainError('You aren\'t authorized to remove the translations.',
                                          RainError.ERROR_AUTHORIZATION));
                return;
            }

            var globalSession = session.global,
                translations = globalSession.get('translations');

            if (translations) {
                globalSession.remove('translations');
                server.sessionStore.save(globalSession, acknowledge);
            } else {
                acknowledge();
            }
        });
    });
}

/**
 * Check if the current user has the permissions to use the 'edit' view mode.
 *
 * @param {Session} session the user session
 * @returns {Boolean} true if the 'edit' view mode can be used
 */
function validateSave(session) {
    var idp = IdentityProvider.get(session),
        user = idp.getUser();

    if (!user || !user.permissions) {
        return false;
    }

    var modeConfiguration = ViewModeUtils.getViewModeServerConfiguration('edit');

    if (!modeConfiguration) {
        return false;
    }

    var neededPermissions = modeConfiguration.permissions || [];

    return user.hasPermissions(neededPermissions);
}

module.exports = {
    saveTranslation: saveTranslation,
    removeTranslations: removeTranslations
};

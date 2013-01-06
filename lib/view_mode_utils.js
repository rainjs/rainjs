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

var configuration = require('./configuration'),
    IdentityProvider = require('./security').IdentityProvider,
    Handlebars = require('handlebars');

var modes = configuration.viewModes && configuration.viewModes.modes,
    viewModePermissions = configuration.viewModes && configuration.viewModes.permissions;

/**
 * Utility class that provide convenience methods for "view modes" and inline editing.
 *
 * @name ViewModeUtils
 * @class
 */
function ViewModeUtils() {}

/**
 * Checks if the current view mode is set to edit translations.
 *
 * @param {Session} session the user session
 *
 * @returns {Boolean} true if the view mode is 'edit'.
 */
ViewModeUtils.isEditMode = function (session) {
    return ViewModeUtils.getViewMode(session) === 'edit';
};

/**
 * Gets the server configuration parameters for the 'edit' view mode.
 *
 * @returns {Object|undefined} the 'edit' config parameter or undefined.
 */
ViewModeUtils.getEditModeConfiguration = function () {
    if (!modes) {
        return;
    }

    for (var i = 0, len = modes.length; i < len; i++) {
        if (modes[i].key === 'edit') {
            return modes[i].config;
        }
    }
};

/**
 * Get the permissions required to see and use a specific view mode's features.
 *
 * @param {String} mode the view mode
 *
 * @returns {Array} the view mode permissions
 */
ViewModeUtils.getViewModePermissions = function (mode) {
    if (!modes) {
        return;
    }

    for (var i = 0, len = modes.length; i < len; i++) {
        if (modes[i].key === mode) {
            return modes[i].permissions;
        }
    }
};

/**
 * Gets a view mode server configuration object.
 *
 * @param {String} mode the view mode
 *
 * @returns {Object} the view mode configuration object
 */
ViewModeUtils.getViewModeServerConfiguration = function (mode) {
    if (!modes) {
        return;
    }

    for (var i = 0, len = modes.length; i < len; i++) {
        if (modes[i].key === mode) {
            return modes[i];
        }
    }
};

/**
 * Gets the inline translations from the user session.
 *
 * @param {Session} session the user session
 *
 * @returns {Object|undefined} the inline translations or undefined
 */
ViewModeUtils.getInlineTranslations = function (session) {
    if (!session) {
        return;
    }

    return session.global.get('translations');
};

/**
 * Gets the current view mode from the global part of the session.
 * Currently there are only two possible view modes: "normal" and "edit".
 *
 * @param {Session} session the user session
 *
 * @returns {String} the current view mode
 */
ViewModeUtils.getViewMode = function (session) {
    if (!session) {
        return 'normal';
    }

    var idp = IdentityProvider.get(session),
        user = idp.getUser();

    if (!user) {
        return 'normal';
    }

    return session.global.get('viewMode');
};

/**
 * Check if the current user has the rights to view the view modes selection.
 *
 * @param {Session} session the user session
 *
 * @returns {Boolean} true if the user has the permissions
 */
ViewModeUtils.showViewModes = function (session) {
    if (!modes || !session || !viewModePermissions || viewModePermissions.length === 0) {
        return false;
    }

    var idp = IdentityProvider.get(session),
        user = idp.getUser();

    if (!user) {
        return false;
    }

    if (!user.hasPermissions(viewModePermissions)) {
        return false;
    }

    var count = 0;

    for (var i = 0, len = modes.length; i < len; i++) {
        if (user.hasPermissions(modes[i].permissions || [])) {
            count++;
        }
    }

    return count > 1;
};

/**
 * Attaches to the translated message of an id, information that will be interpreted by the
 * inline editing module. The information is used to generate inline editing sections.
 *
 * @param {Object} component the component properties
 * @param {String} component.id the component id
 * @param {String} component.version the component version
 * @param {Object} translatedData the message information
 *
 * returns {String} the full message
 */
ViewModeUtils.generateTranslationMessage = function (component, translatedData) {
    var msgList = translatedData[1],
        args = translatedData[5] ? JSON.stringify(translatedData[5]) : '';

    var message = [
            translatedData[0],
            '\n<span class="rain-inline-editing" ',
            'data-id="', component.id, '" ',
            'data-version="', component.version, '" ',
            'data-msgId="', Handlebars.Utils.escapeExpression(translatedData[2]), '" ',
            'data-msgIdPlural="', Handlebars.Utils.escapeExpression(translatedData[3] || ''), '" ',
            'data-singular="', Handlebars.Utils.escapeExpression(msgList[1]), '" ',
            'data-plural="', Handlebars.Utils.escapeExpression(msgList[2] || ''), '" ',
            'data-count="', Handlebars.Utils.escapeExpression(translatedData[4] || ''), '" ',
            'data-args="', Handlebars.Utils.escapeExpression(args), '" ',
            '></span>\n'
    ];

    return new Handlebars.SafeString(message.join(''));
};

module.exports = ViewModeUtils;

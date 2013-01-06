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

var configuration = require('rain/lib/configuration'),
    ViewModeUtils = require('rain/lib/view_mode_utils'),
    IdentityProvider = require('rain/lib/security').IdentityProvider;

/**
 * Create the languages object and pass it to the callback.
 *
 * @param {Environment} environment information about the environment context
 * @param {String} environment.language current platform locale
 * @param {Function} callback the function that must be invoked data needed by the template
 * @param {Object} context the context of the template
 * @param {Object} request information about the current request
 * @param {connect.Session} request.session current session
 * @param {Object} request.[query] a map of request query parameters (http only)
 * @param {Object} request.[headers] a map of request headers (http only)
 * @param {String} request.[url] the full request URL (http only)
 * @param {String} request.type type of request 'http' | 'websocket'
 */
function index(environment, callback, context, request) {
    var idp = IdentityProvider.get(request.session),
        user = idp.getUser(),
        userPermissions = user.permissions || [];

    var editModeConfig = ViewModeUtils.getEditModeConfiguration(),
        languagePermissionPrefix = (editModeConfig && editModeConfig.languagePermissionPrefix) || '';

    var languages = [];
    for (var i = 0; i < environment.languages.length; i++) {
        var language = environment.languages[i],
            key = language.key;

        if (userPermissions.indexOf(languagePermissionPrefix + key) < 0) {
            continue;
        }

        languages.push({
            value: key,
            text: language.text,
            selected: environment.language === key
        });
    }

    callback(null, {
        languages: languages
    });
}

module.exports = {
    index: index
};

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

var Translation = require('../translation'),
    renderer = require('../renderer');

/**
 * This Handlebars helper is used to translate plural text.
 *
 * Syntax::
 *
 *      {{nt msgId msgIdPlural count [[arg1] [arg2] [argN]]}}
 *
 * @example 1:
 *
 *      <span>
 *          {{nt "%1$s %2$s, you won one car." "%1$s %2$s, you won %3$d cars." 4 "Mr." "Wayne" 4}}
 *      </span>
 *
 *
 * If a "var" parameter is used the helper returns an empty string
 * and stores the translation on the context for future use:
 *
 * @example 2:
 *
 *      {{nt "%1$s %2$s, you won one car." "%1$s %2$s, you won %3$d cars." 4 "Mr." "Wayne" 4 var="winningAnnouncement"}}
 *      <span>
 *          {{winningAnnouncement}}
 *      </span>
 *
 *
 *
 * @name TranslationPluralHelper
 * @class
 * @constructor
 */
function TranslationPluralHelper() {}

/**
 * Translates a message to the language specified in the platform configuration. First it checks if
 * the message exists for the platform language. If this is not found it tries the default language.
 * The last fallback is to return the message passed as parameter. It also decides if the
 * singular or plural form should be used based on the count parameter.
 *
 * @param {String} msgId the message id for the translation
 * @param {String} msgIdPlural the message id for the plural translation
 * @param {String} count the count for the plural decision
 * @param {String|Number} [arg1..N] the arguments for the translation text
 * @returns {String} translated text
 */
TranslationPluralHelper.prototype.helper = function (msgId, msgIdPlural, count) {
    var args = Array.prototype.slice.call(arguments, 3, arguments.length - 1),
        options = arguments[arguments.length - 1],
        id = options.hash.id,
        message;

    message = Translation.get().translate(renderer.rain.component,
                                          renderer.rain.environment.language,
                                          id || msgId, msgId, msgIdPlural, count, args);

    // If the "var" parameter is specified, save the message in a variable in context.
    if (options.hash['var']) {
        this[options.hash['var']] = message;
        return '';
    }

    return message;
};

module.exports = {
    name: 'nt',
    helper: new TranslationPluralHelper().helper
};

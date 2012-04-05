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
 * @example
 *      <span>
 *          {{nt "%1$s %2$s, you won one car." "%1$s %2$s, you won %3$d cars." 4 "Mr." "Wayne" 4}}
 *      </span>
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
    var args = Array.prototype.slice.call(arguments, 3, arguments.length - 1);
    return Translation.get().translate(renderer.rain.component, msgId, msgIdPlural, count, args);
};

module.exports = {
    name: 'nt',
    helper: new TranslationPluralHelper().helper
};

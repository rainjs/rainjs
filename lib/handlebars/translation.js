"use strict";

var Translation = require('../translation'),
    renderer = require('../renderer');

/**
 * This Handlebars helper is used to translate singular text.
 *
 * Syntax::
 *
 *      {{t msgId [[arg1] [arg2] [argN]]}}
 *
 * @example
 *      <span>
 *          {{t "How are you?"}}
 *          {{t "How are you %s?" "Batman"}}
 *      </span>
 *
 *
 * @name TranslationHelper
 * @class
 * @constructor
 */
function TranslationHelper() {}

/**
 * Translates a message to the language specified in the platform configuration. First it checks if
 * the message exists for the platform language. If this is not found it tries the default language.
 * The last fallback is to return the message passed as parameter.
 *
 * @param {String} msgId the message id for the translation
 * @param {String|Number} [arg1..N] the arguments for the translation text
 * @returns {String} the translated text
 */
TranslationHelper.prototype.helper = function (msgId) {
    var args = Array.prototype.slice.call(arguments, 1, arguments.length - 1);
    return Translation.get().translate(renderer.rain.component, msgId, undefined, undefined, args);
};

module.exports = {
    name: 't',
    helper: new TranslationHelper().helper
};

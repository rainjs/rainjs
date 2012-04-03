"use strict";

var translate = require('../translation').translate,
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
 * The helper receives parameters to translate it and replaces the given arguments
 * with the translated text.
 *
 * @param {String} msgId the message id for the translation
 * @param {String|Number} [arg1..N] the arguments for the translation text
 * @returns {String} the translated text
 */
TranslationHelper.prototype.helper = function (msgId) {
    var args = Array.prototype.slice.call(arguments, 1, arguments.length - 1);
    return translate(renderer.rain.component, msgId, undefined, undefined, args);
};

module.exports = {
    name: 't',
    helper: new TranslationHelper().helper
};

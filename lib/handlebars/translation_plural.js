"use strict";

var translate = require('../translation').translate;
var renderer = require('../renderer');

/**
 * This Handlebars helper is used to translate plural text.
 *
 * Syntax::
 *
 *      {{nt msgId msgIdPlural count [arg1] [arg2] [argN]}}
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
 * The helper receives parameters to translate it and replaces the given arguments
 * with the translated text.
 *
 * @param {String} msgId the message id for the translation
 * @param {String} msgIdPlural the message id for the translation
 * @param {String} count the count for the plural decision
 * @param [argN] the arguments for the translation text
 * @returns {String} translated text
 */
TranslationPluralHelper.prototype.helper = function (msgId, msgIdPlural, count) {
    var argsLength = arguments.length;
    return translate(renderer.rain.component, msgId, msgIdPlural, count,
                     Array.prototype.slice.call(arguments, 3, argsLength - 1));
};

module.exports = {
    name: 'nt',
    helper: new TranslationPluralHelper().helper
};

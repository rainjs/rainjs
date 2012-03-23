"use strict";

var translate = require('../translation').translate;
var renderer = require('../renderer');

/**
 * This Handlebars helper is used to translate plural text
 *
 * Syntax::
 *
 *      {{t msgid [arg1] [arg2] [argN]}}
 *
 * @example
 *      {{t "Ce mai faci?"}}
 *      {{t "Ce mai faci %s?" "Batman"}}
 *
 *
 * @name TranslationPluralHelper
 * @constructor
 */
function TranslationPluralHelper() {}

/**
 * The helper receives parameters to translate it and replaces the given arguments with the translated text.
 *
 * @param {String} msgid the message id for the translation
 * @param [argN] the arguments for the translation text
 * @returns {String} translated text
 */
TranslationPluralHelper.prototype.helper = function (msgid) {
    var argsLength = arguments.length;
    return translate(renderer.rain.component, msgid, msgidPlural, count, Array.prototype.slice.call(arguments, 1, argsLength-1));
};

module.exports = {
    name: 't',
    helper: new TranslationPluralHelper().helper
};

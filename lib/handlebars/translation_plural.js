"use strict";

var translate = require('../translation').translate;
var renderer = require('../renderer');

/**
 * This Handlebars helper is used to translate plural text
 *
 * Syntax::
 *
 *      {{nt msgid msgidPlural count [arg1] [arg2] [argN]}}
 *
 * @example
 *      {{nt "%s %s, you won %d car." ""%s %s, you won %d cars." 4 "Mr." "Wayne" 4}}
 *
 *
 * @name TranslationHelper
 * @constructor
 */
function TranslationHelper() {}

/**
 * The helper receives parameters to translate it and replaces the given arguments with the translated text.
 *
 * @param {String} msgid the message id for the translation
 * @param {String} msgidPlural the message id for the translation
 * @param {String} count the count for the plural decision
 * @param [argN] the arguments for the translation text
 * @returns {String} translated text
 */
TranslationHelper.prototype.helper = function (msgid, msgidPlural, count) {
    var argsLength = arguments.length;
    return translate(renderer.rain.component, msgid, msgidPlural, count, Array.prototype.slice.call(arguments, 3, argsLength-1));
};

module.exports = {
    name: 'nt',
    helper: new TranslationHelper().helper
};

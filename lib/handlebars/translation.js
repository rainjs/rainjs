"use strict";

var translate = require('../translation').translate;
var renderer = require('../renderer');

/**
 * This Handlebars helper is used to translate singular text.
 *
 * Syntax::
 *
 *      {{t msgId [arg1] [arg2] [argN]}}
 *
 * @example
 *      <span>
 *          {{t "Ce mai faci?"}}
 *          {{t "Ce mai faci %s?" "Batman"}}
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
 * @param [argN] the arguments for the translation text
 * @returns {String} the translated text
 */
TranslationHelper.prototype.helper = function (msgId) {
    var argsLength = arguments.length;
    return translate(renderer.rain.component, msgId, undefined, undefined,
                     Array.prototype.slice.call(arguments, 1, argsLength - 1));
};

module.exports = {
    name: 't',
    helper: new TranslationHelper().helper
};

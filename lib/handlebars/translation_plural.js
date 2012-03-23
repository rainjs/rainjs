"use strict";

var translate = require('../translation').translate;
var renderer = require('../renderer');

/**
 * This Handlebars helper is used to translate text
 *
 * @name TranslationHelper
 * @constructor
 */
function TranslationHelper() {}

/**
 * The helper receives parameters to translate it over gettext.
 *
 * @param {String} msgid the message id for the translation
 * @param {String} msgid_plural the plural message id for the translation
 * @param {String} msgidPlural the message id for the translation
 * @param {String} count the count for the plural decision
 * @returns {String} translated text
 */
TranslationHelper.prototype.helper = function (msgid, msgidPlural, count) {
    var argsLength = arguments.length;
    var args = null;
    if(argsLength > 3){
        args = arguments.splice(0, 3);
    }
    return translate(renderer.rain.component, msgid, msgidPlural, count, args);
};

module.exports = {
    name: 'nt',
    helper: new TranslationHelper().helper
};

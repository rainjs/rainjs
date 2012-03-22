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
 * @param {String} args the arguments for the replacement in the translation
 * @returns {String} translated text
 */
TranslationHelper.prototype.helper = function (msgid, msgidPlural, count, args) {
    return translate(renderer.rain.component, msgid, msgidPlural, count, args);
};

module.exports = {
    name: 'translation',
    helper: new TranslationHelper().helper
};

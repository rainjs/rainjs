"use strict";

var poUtils = require('./po_utils'),
    Jed = require('jed').Jed,
    conf = require('./configuration'),
    fs = require('fs'),
    path = require('path');

/**
 * Holds the Jed instances for all components and languages
 *
 * @type {Object}
 * @private
 */
var locales = {};

/**
 * Holds the translation instance
 *
 * @type {Translation}
 * @private
 */
var instance;

/**
 * Empty jed instance used to enable the default behavior of gettext
 *
 * @type {Jed}
 * @private
 */
var emptyJed = new Jed({});

/**
 * Implements internationalization support
 *
 * @name Translation
 * @constructor
 */
function Translation() {

}

/**
 * Translates a message to the language specified in the platform configuration. First it checks if
 * the message exists for the platform language. If this is not found it tries the default language.
 * The last fallback is to return the message passed as parameter.
 *
 * @param {Object} component the descriptor of the component for which we do the translation
 * @param {String} msgid the message to be translated
 * @param {String} [msgidPlural] the plural form of the message
 * @param {Number} [count] determines what form of the translation will be used: singular or plural. In some languages the rules for plurals are more complex
 * @param {Array} [args] an array of values that will replace the placeholders in the message
 * @returns {String} the translated message
 * @memberOf Translation#
 */
Translation.prototype.translate = function (component, msgid, msgidPlural, count, args) {
    //Jed already validates the parameters

    var jed,
        id = component.id + '_' + component.version;

    //checks if locales exist for this component
    if (locales[id]) {
        jed = locales[id][conf.language];

        if (!jed || !msgidExists(jed, msgid, count)) {
            jed = locales[id][conf.defaultLanguage];
        }
    }

    //if no locale was found we create an empty instance to enable the default behavior of gettext:
    //it returns msgid if count equals 1 or msgidPlural otherwise;
    //in this way, the program is working without any translation files
    jed = jed || emptyJed;

    try {
        return jed.translate(msgid).ifPlural(count, msgidPlural).fetch(args);
    } catch (ex) {
        //TODO: think more about what should happen if Jed throws an error
        return "A translation error occured.";
    }

};

/**
 * Checks if a message exists for a given locale.
 *
 * @param {Jed} jed the Jed instance in which we check if msgid exists
 * @param {String} msgid the message to check
 * @param {Number} count the count for which we need the message to exist
 * @returns {Boolean} the result of the check
 * @memberOf Translation
 * @private
 */
function msgidExists(jed, msgid, count) {
    count = count || 1;
    var domain = jed.textdomain(),
        data = jed.options.locale_data[domain],
        index = jed.pluralFormFn(count) + 1,
        list = data[msgid];

    if (list && index < list.length) {
        return true;
    }

    return false;
}

/**
 * Returns a function that calculates which message should be used for a given count.
 * It uses the information from the po file headers or the english formula as the default.
 *
 * @param {String} pluralFormString the value of the Plural-Forms header from the po file
 * @returns {Function} a function to calculate which plural form to use
 * @memberOf Translation
 * @private
 */
function getPluralFormFunc (pluralFormString) {
    return Jed.PF.compile(pluralFormString || "nplurals=2; plural=(n != 1);");
}

/**
 * Loads a po file
 *
 * @param {String} file the file path
 * @param {String} locale the locale for which this file should be used
 * @param {Object} component the descriptor of the component
 * @throws {RainError} when the po file doesn't exist
 * @memberOf Translation#
 */
Translation.prototype.loadLanguageFile = function (file, locale, component) {
    try {
        var content = fs.readFileSync(file, 'utf8');
    } catch (ex) {
        throw new RainError('An error occured while trying to read %s', [file], RainError.ERR_IO);
    }
    var parsed = poUtils.parsePo(content),
        domain = path.basename(file, '.po'),
        data = {};

    //sets the gettext domain
    if (parsed) {
        if (!parsed[""]) {
            parsed[""] = {};
        }
        if (!parsed[""].domain) {
            parsed[""].domain = domain;
        }
        domain = parsed[""].domain;
        data[domain] = parsed;
    }

    var jed = new Jed({
        domain: domain,
        locale_data: data
    });

    jed.pluralFormFn = getPluralFormFunc(parsed[""].plural_forms);

    var id = component.id + '_' + component.version;

    if (!locales[id]) {
        locales[id] = {};
    }

    locales[id][locale] = jed;
};

/**
 * Generate a context in which the component will be run
 *
 * @param {Object} component the component configuration for the component
 * @returns {Object} the context in which the component will run
 * @memberOf Translation#
 */
Translation.prototype.generateContext = function (component) {
    var self = this;

    return {
        nt: this.translate.bind(this, component),
        t: function (msgid, args) {
            return self.translate(component, msgid, undefined, undefined, args);
        }
    };
};

/**
 * Returns the Tranlation instance
 *
 * @returns {Translation} the singleton instance
 * @memberOf Translation
 */
Translation.get = function () {
    return instance || (instance = new Translation());
};

module.exports = Translation;

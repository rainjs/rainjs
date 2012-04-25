"use strict";

var poUtils = require('./po_utils'),
    Jed = require('jed').Jed,
    configuration = require('./configuration'),
    fs = require('fs'),
    path = require('path');

/**
 * Holds the Jed instances for all components and languages.
 *
 * @type {Object}
 * @private
 */
var locales = {};

/**
 * Holds the translation instance.
 *
 * @type {Translation}
 * @private
 */
var instance;

/**
 * Empty jed instance used to enable the default behavior of gettext.
 *
 * @type {Jed}
 * @private
 */
var emptyJed = new Jed({});

/**
 * Implements internationalization support.
 *
 * @name Translation
 * @class
 * @constructor
 *
 * @property {Date} lastModified the last modified date for the translations
 */
function Translation() {
    this.lastModified = new Date();
}

/**
 * Translates a message to the language specified in the platform configuration. First it checks if
 * the message exists for the platform language. If this is not found it tries the default language.
 * The last fallback is to return the message passed as parameter.
 *
 * @param {Object} component the descriptor of the component for which we do the translation
 * @param {String} msgId the message to be translated
 * @param {String} [msgIdPlural] the plural form of the message
 * @param {Number} [count] determines what form of the translation will be used: singular or plural. In some languages the rules for plurals are more complex
 * @param {Array} [args] an array of values that will replace the placeholders in the message
 * @returns {String} the translated message
 */
Translation.prototype.translate = function (component, msgId, msgIdPlural, count, args) {
    // Jed already validates the parameters.

    var jed,
        id = computeLocaleId(component);

    // Checks if locales exist for this component.
    if (locales[id]) {
        jed = locales[id][configuration.language];

        if (!jed || !msgIdExists(jed, msgId, count)) {
            jed = locales[id][configuration.defaultLanguage];
        }
    }

    // If no locale was found we create an empty instance to enable the default behavior of gettext:
    // it returns msgId if count equals 1 or msgIdPlural otherwise.
    // In this way, the program is working without any translation files.
    jed = jed || emptyJed;

    try {
        return jed.translate(msgId).ifPlural(count, msgIdPlural).fetch(args);
    } catch (ex) {
        //TODO: think more about what should happen if Jed throws an error
        return "A translation error occured.";
    }
};

/**
 * Checks if a message exists for a given locale.
 *
 * @param {Jed} jed the Jed instance in which we check if msgId exists
 * @param {String} msgId the message to check
 * @param {Number} count the count for which we need the message to exist
 * @returns {Boolean} the result of the check
 * @private
 * @memberOf Translation
 */
function msgIdExists(jed, msgId, count) {
    count = count || 1;
    var domain = jed.textdomain(),
        data = jed.options.locale_data[domain],
        index = jed.pluralFormFn(count) + 1,
        list = data[msgId];

    if (list && index < list.length) {
        return true;
    }

    return false;
}

/**
 * Returns a function that calculates which message should be used for a given count.
 * It uses the information from the po file headers or the English formula as the default.
 *
 * @param {String} pluralFormString the value of the Plural-Forms header from the po file
 * @returns {Function} a function to calculate which plural form to use
 * @private
 * @memberOf Translation
 */
function getPluralFormFunc(pluralFormString) {
    return Jed.PF.compile(pluralFormString || "nplurals=2; plural=(n != 1);");
}

/**
 * Loads a po file.
 *
 * @param {String} file the file path
 * @param {String} locale the locale for which this file should be used
 * @param {Object} component the descriptor of the component
 * @throws {RainError} when the po file doesn't exist
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

    // Sets the gettext domain.
    if (!parsed[""]) {
        parsed[""] = {};
    }
    if (!parsed[""].domain) {
        parsed[""].domain = domain;
    }
    domain = parsed[""].domain;
    data[domain] = parsed;

    var jed = new Jed({
        domain: domain,
        locale_data: data
    });

    jed.pluralFormFn = getPluralFormFunc(parsed[""].plural_forms);

    var id = computeLocaleId(component);

    if (!locales[id]) {
        locales[id] = {};
    }

    locales[id][locale] = jed;
};

/**
 * Get the translation messages from a component, in a specific language.
 *
 * If there aren't any translations messages for the component an empty Object is returned.
 *
 * @param {Object} component the component configuration
 * @param {String} locale the language
 * @returns {Object} the messages object
 * @throws {RainError} 'component' precondition failed when the component parameter is missing
 * @throws {RainError} 'locale' precondition failed when the locale parameter is missing
 */
Translation.prototype.getLocale = function (component, locale) {
    if (!component) {
        throw new RainError('The "component" parameter is missing.',
                            RainError.ERROR_PRECONDITION_FAILED, 'component');
    }

    if (!locale) {
        throw new RainError('The "locale" parameter is missing.',
                            RainError.ERROR_PRECONDITION_FAILED, 'locale');
    }

    var id = computeLocaleId(component);

    if (!locales[id] || !locales[id][locale]) {
        return {};
    }

    var jed = locales[id][locale];

    return {
        domain: jed.textdomain(),
        data: jed.options.locale_data
    };
};

/**
 * Creates an object which contains the translations for the component and required languages.
 *
 * @param {Object} component Component object
 * @returns Object which contains language and defaultLanguage if their are not similar
 * @throws {RainError} 'component' precondition failed when  the component parameter is missing
 */
Translation.prototype.getLocales = function (component) {
    if (!component) {
        throw new RainError('The "component" parameter is missing.',
                            RainError.ERROR_PRECONDITION_FAILED, 'component');
    }

    var componentLocale = {
        language: this.getLocale(component, configuration.language)
    };

    if (configuration.language !== configuration.defaultLanguage) {
        componentLocale.defaultLanguage = this.getLocale(component, configuration.defaultLanguage);
    }

    return componentLocale;
};

/**
 * Compute the locale id based on the component's properties.
 *
 * @param {Object} component the component configuration
 * @returns {String} the locale id
 * @private
 * @memberOf Translation
 */
function computeLocaleId(component) {
    return component.id + ' ' + component.version;
}

/**
 * Generate a context in which the component will be run.
 *
 * @param {Object} component the component configuration for the component
 * @returns {Object} the context in which the component will run
 */
Translation.prototype.generateContext = function (component) {
    var self = this;

    return {
        /**
         * Allow component developers to use translation in server-side code. This method
         * is automatically injected in the scope of the server side modules. It uses the messages
         * defined for the component in which the code runs. This method should be used when
         * the program needs to decide if the singular or plural form should be used based on
         * the value of a variable.
         *
         * @example
         *      nt('one book', '%1$d books', 2, [2]);
         *
         * @param {String} msgId the message to be translated
         * @param {String} msgIdPlural the plural form of the message
         * @param {Number} count determines what form of the translation will be used: singular or plural
         * @param {Array} [args] an array of values that will replace the placeholders in the message
         * @returns {String} the translated message
         * @function
         * @name nt
         * @memberOf Translation#
         */
        nt: this.translate.bind(this, component),
        /**
         * Allow component developers to use translation in server-side code. This method
         * is automatically injected in the scope of the server side modules. It uses the messages
         * defined for the component in which the code runs.
         *
         * @example
         *      t('%1$s and %2$s are playing.', ['Mike', 'Joey']);
         *
         * @param {String} msgId the message to be translated
         * @param {Array} [args] an array of values that will replace the placeholders in the message
         * @returns {String} the translated message
         * @function
         * @name t
         * @memberOf Translation#
         */
        t: function (msgId, args) {
            return self.translate(component, msgId, undefined, undefined, args);
        }
    };
};

/**
 * Returns the Translation instance.
 *
 * @returns {Translation} the singleton instance
 * @memberOf Translation
 */
Translation.get = function () {
    return instance || (instance = new Translation());
};

module.exports = Translation;

// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";

var poUtils = require('./po_utils'),
    Jed = require('jed').Jed,
    configuration = require('./configuration'),
    fs = require('fs'),
    path = require('path'),
    ViewModeUtils = require('./view_mode_utils');

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
 * When the view mode is set to 'edit' (the inline editing feature is used) the inline translations
 * take precedence.
 *
 * If the edit mode is used, the translation message has appended to it an html tag with
 * information needed by the inline translations. On the client-side these tags are found and
 * stripped and the information is attached to the text node's DOM parent.
 *
 * @param {Object} component the descriptor of the component for which we do the translation
 * @param {String} language the translation language
 * @param {Object} inlineTranslations the messages translated using the edit view mode
 * @param {Booolean} isEditMode true is the current user changed the view mode to edit
 * @param {String} msgId the message to be translated
 * @param {String} [msgIdPlural] the plural form of the message
 * @param {Number} [count] determines what form of the translation will be used: singular or plural. In some languages the rules for plurals are more complex.
 * @param {Array} [args] an array of values that will replace the placeholders in the message
 *
 * @returns {String} the translated message
 */
Translation.prototype.translate = function (component, language, inlineTranslations, isEditMode,
                                            msgId, msgIdPlural, count, args) {
    // Jed already validates the parameters.

    var jed, pluralFormFn, list, componentTranslations, languageMessages, defaultMessages,
        id = computeLocaleId(component),
        locale = locales[id],
        defaultLanguage = configuration.defaultLanguage;

    if (isEditMode) {
        componentTranslations = inlineTranslations && inlineTranslations[id];
        languageMessages = componentTranslations && componentTranslations[language];
        defaultMessages = componentTranslations && componentTranslations[defaultLanguage];
    }

    // Search the message in the inline translations for the current language.
    if (languageMessages) {
        list = getTranslationList(languageMessages, msgId);

        if (list) {
            pluralFormFn = (locale && locale[language].pluralFormFn) ||
                            getPluralFormFunc();

            var translatedMessage = translateInline(pluralFormFn, list,
                                                    msgId, msgIdPlural, count, args);
            if (isEditMode) {
                return ViewModeUtils.generateTranslationMessage(component,
                                        [translatedMessage, list, msgId, msgIdPlural, count, args]);
            }

            return translatedMessage;
        }
    }

    // Search the message in the .po files for the current language.
    jed = locale && locale[language];

    if (!jed || !msgIdExists(jed, msgId, count)) {

        // Search the message in the inline translations for the default language.
        if (defaultMessages) {
            list = getTranslationList(defaultMessages, msgId);
            if (list) {
                pluralFormFn = (locale && locale[defaultLanguage].pluralFormFn) ||
                                getPluralFormFunc();

                var translatedMessage = translateInline(pluralFormFn, list,
                                                        msgId, msgIdPlural, count, args);
                if (isEditMode) {
                    return ViewModeUtils.generateTranslationMessage(component,
                                        [translatedMessage, list, msgId, msgIdPlural, count, args]);
                }

                return translatedMessage;
            }
        }

        // Search the message in the .po files for the default language.
        jed = locale && locale[defaultLanguage];
    }

    // If no locale was found we create an empty instance to enable the default behavior of gettext:
    // it returns msgId if count equals 1 or msgIdPlural otherwise.
    // In this way, the program is working without any translation files.
    jed = jed || emptyJed;

    try {
        var translatedMessage = jed.translate(msgId).ifPlural(count, msgIdPlural).fetch(args);

        if (isEditMode) {
            return ViewModeUtils.generateTranslationMessage(component,
                                    [translatedMessage, getMessageList(jed, msgId, msgIdPlural),
                                     msgId, msgIdPlural, count, args]);
        }

        return translatedMessage;
    } catch (ex) {
        //TODO: think more about what should happen if Jed throws an error
        return 'A translation error occurred for "' + msgId + '": ' + ex;
    }
};

/**
 * Searches for a translation array in the translations of a component, in a specific language.
 *
 * @param {Array} msgList the messages list
 * @param {String} msgId the message id
 *
 * @returns {Array} the translation array
 */
function getTranslationList(msgList, msgId) {
    if (!msgList) {
        return;
    }

    for (var i = 0, len = msgList.length; i < len; i++) {
        if (msgList[i][0] === msgId) {
            return msgList[i][1];
        }
    }
}

/**
 * Translate a message when the translation data is not in a Jed instance.
 *
 * @param {Function} pluralFormFn the Jed plural form
 * @param {Array} msgList the message array with translations
 * @param {String} msgId the message id
 * @param {String} msgIdPlural the message id used for plural forms
 * @param {Number} count the number used to decide what plural form to use
 * @param {Array} args the message parameters
 *
 * @returns {String} the translated message
 */
function translateInline(pluralFormFn, msgList, msgId, msgIdPlural, count, args) {
    count = count || 1;
    msgIdPlural = msgIdPlural || msgId;

    var index = pluralFormFn(count) + 1,
        data, translatedMessage;

    if (msgList.length <= index) {
        data = [null, msgId, msgIdPlural];
        translatedMessage = data[getPluralFormFunc()(count) + 1];
    } else {
        translatedMessage = msgList[index];

        if (!translatedMessage) {
            data = [null, msgId, msgIdPlural];
            translatedMessage = data[getPluralFormFunc()(count) + 1];
        }
    }

    if (args && args.length > 0) {
        translatedMessage = Jed.sprintf(translatedMessage, args);
    }

    return translatedMessage;
}

/**
 * Get the translation array for a message from a Jed instance.
 *
 * @param {Jed} the Jed instance
 * @param {String} msgId the message id
 *
 * @returns {Array} the translation array
 */
function getMessageList(jed, msgId, msgIdPlural) {
    var domain = jed.textdomain(),
        data = jed.options.locale_data[domain];

    return data[msgId] || [msgIdPlural, msgId, msgIdPlural];
}

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
 * @param {String} [language] the preferred language. If missing platform language is used
 * @returns Object which contains language and defaultLanguage if their are not similar
 * @throws {RainError} 'component' precondition failed when  the component parameter is missing
 */
Translation.prototype.getLocales = function (component, language) {
    if (!component) {
        throw new RainError('The "component" parameter is missing.',
                            RainError.ERROR_PRECONDITION_FAILED, 'component');
    }

    if (!language) {
        language = configuration.language;
    }

    var componentLocale = {
        language: this.getLocale(component, language)
    };

    if (language !== configuration.defaultLanguage) {
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
    return component.id + ' ' + component.version.replace('.', '_');
}

/**
 * Generate a context in which the component will be run.
 *
 * @param {Object} component the component configuration for the component
 * @param {String} language the language
 * @param {Object} inlineTranslations the messages translated using the edit view mode
 * @param {Booolean} isEditMode true is the current user changed the view mode to edit
 *
 * @returns {Object} the context in which the component will run
 */
Translation.prototype.generateContext = function (component, language,
                                                  inlineTranslations, isEditMode) {
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
         *
         * @returns {String} the translated message
         *
         * @function
         * @name nt
         * @memberOf Translation#
         */
        nt: function (msgId, msgIdPlural, count, args) {
            var result = self.translate(component, language, inlineTranslations, isEditMode,
                                        msgId, msgIdPlural, count, args);

            if (isEditMode) {
                return result.toString();
            }

            return result;
        },
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
         *
         * @returns {String} the translated message
         *
         * @function
         * @name t
         * @memberOf Translation#
         */
        t: function (msgId, args) {
            var result = self.translate(component, language, inlineTranslations, isEditMode,
                                        msgId, undefined, undefined, args);

            if (isEditMode) {
                return result.toString();
            }

            return result;
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

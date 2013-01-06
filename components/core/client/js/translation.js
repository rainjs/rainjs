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

define(['raintime/lib/jed',
        'raintime/client_storage'
], function (Jed, ClientStorage) {

    /**
     * Empty jed instance used to enable the default behavior of gettext.
     *
     * @type {Jed}
     * @private
     */
    var emptyJed = new Jed({});

    /**
     * Local storage instance used to get / save the inline translations.
     *
     * @type {ClientStorage}
     * @private
     */
    var storage = new ClientStorage();

    /**
     * True when the inline editing is enabled.
     *
     * @type Boolean
     * @private
     */
    var isEditMode = rainContext.viewMode === 'edit';

    /**
     * The current user / application / translation language.
     *
     * @type String
     * @private
     */
    var language = rainContext.language;

    /**
     * The default language used for find messages that aren't translated in the current language.
     *
     * @type String
     * @private
     */
    var defaultLanguage = rainContext.defaultLanguage;

    /**
     * Provides client-side text localization support. The constructor receives the translations
     * associated with a component and constructs the Jed instances that will be used to translate
     * message keys.
     *
     * @name ClientTranslation
     * @class
     * @constructor
     *
     * @property {Object} locales the object with the Jed instances
     *
     * @param {Object} component the component properties
     * @param {String} component.id the component id
     * @param {String} component.version the component version
     * @param {Object} localeJson the object containing the information about the translations
     * @param {Object} localeJson.language the current language translations for a component
     * @param {Object} localeJson.defaultLanguage the default language translations for a component
     */
    function ClientTranslation(component, localeJson) {
        this._component = component;
        this._id = component.id + ' ' + component.version.replace('.', '_');

        this.locales = {};

        if (localeJson.language) {
            createJed(this, localeJson, 'language');
        }
        if (localeJson.defaultLanguage) {
            createJed(this, localeJson, 'defaultLanguage');
        }
    }

    /**
     * Creates a Jed instance and adds it to the locales map.
     *
     * @param {ClientTranslation} self the class instance
     * @param {Object} localeJson the translations data
     * @param {String} type 'language' or 'defaultLanguage'
     *
     * @private
     * @memberOf ClientTranslation#
     */
    function createJed(self, localeJson, type) {
        var jedOptions = localeJson[type],
            domain = jedOptions.domain,
            data = jedOptions.data;

        if (!domain || !data || !data[domain] || !data[domain]['']) {
            return;
        }

        var jed = new Jed({
            domain: domain,
            locale_data: data
        });
        jed.pluralFormFn = getPluralFormFunc(data[domain][''].plural_forms);

        self.locales[type] = jed;
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
     * Saves an inline translation in the local storage.
     *
     * @param {Object} data the translation data
     * @param {String} data.msgId the message id that was updated
     * @param {Array} data.translations the translations array in the Jed format
     */
    ClientTranslation.prototype.saveInlineTranslation = function (data) {
        var translations = storage.get('translations') || {};

        if (!translations[this._id]) {
            translations[this._id] = {};
        }

        if (!translations[this._id][language]) {
            translations[this._id][language] = [];
        }

        var messages = translations[this._id][language],
            msgId = data.msgId,
            message;

        for (var i = 0, len = messages.length; i < len; i++) {
            if (messages[i][0] === msgId) {
                message = messages[i];
                break;
            }
        }

        if (message) {
            message[1] = data.translations;
        } else {
            translations[this._id][language].push([msgId, data.translations]);
        }

        storage.set('translations', translations);
    };

    /**
     * Get the translation text for a message key.
     *
     * @param {String} msgId the message id
     * @param {String} msgIdPlural the message id used for plural forms
     * @param {Number} count the number used to decide what plural form to use
     * @param {Array} args the message parameters
     * @returns {String} the translated text or empty string if an error occurred
     */
    ClientTranslation.prototype.translate = function (msgId, msgIdPlural, count, args) {
        var inlineTranslations, componentTranslations, languageMessages, defaultMessages,
            jed, list, pluralFormFn;

        if (isEditMode) {
            inlineTranslations = storage.get('translations');
            componentTranslations = inlineTranslations && inlineTranslations[this._id];
            languageMessages = componentTranslations && componentTranslations[language];
            defaultMessages = componentTranslations && componentTranslations[defaultLanguage];
        }

        if (languageMessages) {
            list = getTranslationList(languageMessages, msgId);

            if (list) {
                pluralFormFn = this.locales['language'] ?
                                 this.locales['language'].pluralFormFn : getPluralFormFunc();

                var translatedMessage = translateInline(pluralFormFn, list,
                                                        msgId, msgIdPlural, count, args);
                if (isEditMode) {
                    return generateTranslationMessage(this._component,
                                      [translatedMessage, list, msgId, msgIdPlural, count, args]);
                }

                return translatedMessage;
            }
        }

        jed = this.locales['language'];

        if (!jed || !msgIdExists(jed, msgId, count)) {

            if (defaultMessages) {
                list = getTranslationList(defaultMessages, msgId);
                if (list) {
                    pluralFormFn = this.locales['defaultLanguage'] ?
                             this.locales['defaultLanguage'].pluralFormFn : getPluralFormFunc();

                    var translatedMessage = translateInline(pluralFormFn, list,
                                                            msgId, msgIdPlural, count, args);
                    if (isEditMode) {
                        return generateTranslationMessage(this._component,
                                      [translatedMessage, list, msgId, msgIdPlural, count, args]);
                    }

                    return translatedMessage;
                }
            }

            jed = this.locales['defaultLanguage'];
        }

        // If no locale was found we create an empty instance to enable the default behavior of
        // gettext: it returns msgId if count equals 1 or msgIdPlural otherwise.
        // In this way, the program is working without any translation files.
        jed = jed || emptyJed;

        try {
            var translatedMessage = jed.translate(msgId).ifPlural(count, msgIdPlural).fetch(args);

            if (isEditMode) {
                return generateTranslationMessage(this._component,
                                        [translatedMessage, getMessageList(jed, msgId),
                                         msgId, msgIdPlural, count, args]);
            }

            return translatedMessage;
        } catch (ex) {
            return '';
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
     * Attaches to the translated message of an id, information that will be interpreted by the
     * inline editing module. The information is used to generate inline editing sections.
     *
     * @param {Object} component the component properties
     * @param {String} component.id the component id
     * @param {String} component.version the component version
     * @param {Object} translatedData the message information
     *
     * returns {String} the full message
     */
    function generateTranslationMessage(component, translatedData) {
        var msgList = translatedData[1],
            args = translatedData[5] ? JSON.stringify(translatedData[5]) : '';

        var message = [
                translatedData[0],
                '\n<span class="rain-inline-editing" ',
                'data-id="', component.id, '" ',
                'data-version="', component.version, '" ',
                'data-msgId="', escapeExpression(translatedData[2]), '" ',
                'data-msgIdPlural="', escapeExpression(translatedData[3] || ''), '" ',
                'data-singular="', escapeExpression(msgList[1]), '" ',
                'data-plural="', escapeExpression(msgList[2] || ''), '" ',
                'data-count="', escapeExpression(translatedData[4] || ''), '" ',
                'data-args="', escapeExpression(args), '" ',
                '></span>\n'
        ];

        return message.join('');
    }

    /**
     * Get the translation array for a message from a Jed instance.
     *
     * @param {Jed} the Jed instance
     * @param {String} msgId the message id
     *
     * @returns {Array} the translation array
     */
    function getMessageList(jed, msgId) {
        var domain = jed.textdomain(),
            data = jed.options.locale_data[domain];

        return data[msgId];
    }

    /**
     * Escape expression function taken from Handlebars. It's the same that's used on the
     * server-side to escape translations when using the t and nt Handlebars helpers.
     *
     * @param {String} exp the expression to be escaped
     *
     * @returns {String} the escaped expression
     */
    function escapeExpression(exp) {
        if (exp === null || exp === false) {
            return '';
        }

        var possible = /[&<>"'`]/;
        if (!possible.test(exp)) {
            return exp;
        }

        var escape = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '`': '&#x60;'
            },
            badChars = /&(?!\w+;)|[<>"'`]/g,
            escapeChar = function (chr) {
                return escape[chr] ? escape[chr] : '&amp;';
            };

        return exp.replace(badChars, escapeChar);
    }

    /**
     * Checks if a message exists for a given locale.
     *
     * @param {Jed} jed the Jed instance in which we check if msgId exists
     * @param {String} msgId the message to check
     * @param {Number} count the count for which we need the message to exist
     * @returns {Boolean} the result of the check
     *
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
     * A map that holds the translation objects. The key is a component identifier obtained in the
     * following way: component.id + ' ' + component.version.
     *
     * @type {Object}
     * @private
     */
    var instances = {};

    /**
     * Creates a new Translation instance for the specified component or returns an existing one.
     * This function will always return the same instance for a specified component, because
     * there is only one locale data object associated with a component.
     *
     * @param {Object} component the component info
     * @param {Object} locale the translations data
     * @param {String} type 'language' or 'defaultLanguage'
     *
     * @returns {ClientTranslation} the instance associated with the specified component
     *
     * @memberOf ClientTranslation
     */
    ClientTranslation.get = function (component, locale) {
        var id = component.id + ' ' + component.version;
        return instances[id] || (instances[id] = new ClientTranslation(component, locale || {}));
    };

    /**
     * Removes the inline translations for all components.
     */
    ClientTranslation.removeInlineTranslations = function () {
        storage.remove('translations');
    };

    return ClientTranslation;
});

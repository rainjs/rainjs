define(['raintime/lib/jed'], function (Jed) {

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
     * @property {Jed} emptyJed empty jed instance used to enable the default gettext behavior
     *
     * @param {Object} localeJson the object containing the information about the translations
     * @param {Object} localeJson.language the current language translations for a component
     * @param {Object} localeJson.defaultLanguage the default language translations for a component
     */
    function ClientTranslation(localeJson) {
        this.locales = {};
        this.emptyJed = new Jed({});

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
     * Get the translation text for a message key.
     *
     * @param {String} msgId the message id
     * @param {String} msgIdPlural the message id used for plural forms
     * @param {Number} count the number used to decide what plural form to use
     * @param {Array} args the message parameters
     * @returns {String} the translated text or empty string if an error occurred
     */
    ClientTranslation.prototype.translate = function (msgId, msgIdPlural, count, args) {
        var jed = this.locales['language'];

        if (!jed || !msgIdExists(jed, msgId, count)) {
            jed = this.locales['defaultLanguage'];
        }

        // If no locale was found we create an empty instance to enable the default behavior of
        // gettext: it returns msgId if count equals 1 or msgIdPlural otherwise.
        // In this way, the program is working without any translation files.
        jed = jed || this.emptyJed;

        try {
            return jed.translate(msgId).ifPlural(count, msgIdPlural).fetch(args);
        } catch (ex) {
            return '';
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
     * A map that holds the translation objects. The key is a component identifier obtained in the
     * following way: component.id + ' ' + component.version
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
     * @returns {ClientTranslation} the instance associated with the specified component
     *
     * @memberOf ClientTranslation
     */
    ClientTranslation.get = function (component, locale) {
        var id = component.id + ' ' + component.version;
        return instances[id] || (instances[id] = new ClientTranslation(locale));
    };

    return ClientTranslation;
});

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

var Translation = require('./translation'),
    config = require('./configuration'),
    logger = require('./logging').get(),
    fs = require('fs'),
    Jed = require('jed').Jed,
    Moment = require('moment'),
    poUtils = require('./po_utils'),
    util = require('./util'),
    path = require('path');

/**
 * Default Values retrieved from the configuration defaults.
 * @type {String}
 */
var DEFAULT_THOUSAND_SEPARATOR = config.format.default_thousand_separator,
    DEFAULT_DECIMAL_SEPARATOR = config.format.default_decimal_separator,
    DEFAULT_CURRENCY_FORMAT = config.format.default_currency,
    DEFAULT_PERCENTAGE_FORMAT = config.format.default_percentage,
    DEFAULT_RANGE_FORMAT = config.format.default_range,
    DEFAULT_TIME_FORMAT = config.format.default_time,
    DEFAULT_DATE_FORMAT = config.format.default_date;

/**
 * Format module that formats date/time/date-range/numbers/currency/percentage depending on the language.
 *
 * Example:
 *
 * .. code-block:: javascript
 *
 *       var today = new Date();
 *       var someInterval =
 *          formatterInstance.formatRange(today, new Date(today.getFullYear(), today.getMonth()+1, today.getDate()), 'de_DE');
 *       var decNumber = formatter(345989.3452, 'de_DE');
 *
 *       console.log(someInterval) // => 'Juli 10 - August 10. 2013'
 *       console.log(decNumber) // => '345.989,3452'
 *
 * @name Format
 * @constructor
 */
function Format() {

    this.translation = Translation.get();
    this._locales = {};
    this._emptyJed = new Jed({});
    var self = this;
    var location = config.translationPath;

    try {
        util.walkSync(location, '.po', function (file) {
            var splitedLocation = file.split(path.sep),
                language = splitedLocation[splitedLocation.length - 2];

            var content = fs.readFileSync(file, 'utf8'),
                parsed = poUtils.parsePo(content),
                domain = path.basename(file, '.po'),
                data = {};

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

            self._locales[language] = jed;
        });
    } catch (ex) {
        logger.error(ex.stack);
    }
}

/**
 * The singleton instance of the Format module.
 *
 * @type {Format}
 * @private
 */
Format._instance = null;

/**
 * Singleton method to get the instance of the Format module.
 *
 * @static
 * @returns {Format}
 */
Format.get = function () {
    return Format._instance ||
        (Format._instance = new Format());
};


/**
 * Translates a text. Logs an error if the translation was not possible.
 *
 * @param {String} customId the customId from the .po file
 * @param {String} msgId the msgId representing the default text for that customId
 * @param {String} language the language in which you want to translate
 * @param {[String]} arguments the arguments to be inserted in the translation
 * @returns {String} the translated text.
 */
Format.prototype.translate = function (customId, msgId, language, arguments) {
    var jed;

    if (this._locales[language]) {
        jed = this._locales[language];
    }

    if (!jed || !this._msgIdExists(jed, customId)) {
        jed = this._locales[config.defaultLanguage];
        if(!this._msgIdExists(jed, customId)) {
            customId = msgId;
            jed = this._emptyJed;
        }
    }

    try {
        return jed.translate(customId).fetch(arguments);
    } catch (err) {
        logger.error(util.format('A translation error occurred: %s, ' +
            'moduleId = %s, language = %s. ' +
            'msgId = %s, args = %s',
            err, id, language, msgId, arguments));
        return 'A translation error occurred.';
    }
};

/**
 * Formats a date range in the country's default date range format. If not present falls to default
 * Language of the server and if that is also missing it uses a configuration preset format.
 *
 * @param {String} startDate the start date of the range
 * @param {String} endDate the end date of the range
 * @param {String} locale the language in which you want to format
 * @returns {String} the formatted range in the desired language
 */
Format.prototype.formatRange = function (startDate, endDate, locale) {

    var startYear = startDate.getFullYear(),
        endYear = endDate.getFullYear(),
        output;

    Moment.lang(this._getMomentLang(locale));

    var rangeFormat = this.translate('range.format', DEFAULT_RANGE_FORMAT, locale);

    if(endYear === startYear) {
        output = this.formatDate(startDate, locale, 'MMMM DD') + ' - ' +
            this.formatDate(endDate, locale, rangeFormat);
    } else if (endYear !== startYear) {
        output = this.formatDate(startDate, locale, rangeFormat) + ' - ' +
            this.formatDate(endDate, locale, rangeFormat);
    }

    return output;
};

/**
 * Formats a date in the country's date format standards. If not present falls to default Language of the server
 * and if that is also missing it uses a configuration preset format.
 *
 * @param {String} date the date that you want to format
 * @param {String} locale the language in which you want to format the date
 * @param {String} [format] optional parameter of the way to format the date
 * @returns {String} the formatted date in the desired language
 */
Format.prototype.formatDate = function (date, locale, format) {

    //set a moment language mapping here depending on the locale
    Moment.lang(this._getMomentLang(locale));

    var dateFormat = this.translate('date.format', DEFAULT_DATE_FORMAT, locale);

    return Moment(date).format(format || dateFormat);
};

/**
 * Formats a time in the country's time format standards. If not present falls to default Language of the server
 * and if that is also missing it uses a configuration preset format.
 *
 * @param {String} date the date for which you want the time format
 * @param {String} locale the language in which you want to format the time
 * @returns {String} the formatted time in the desired language
 */
Format.prototype.formatTime = function (date, locale) {

    Moment.lang(this._getMomentLang(locale));

    var timeFormat = this.translate('time.format', DEFAULT_TIME_FORMAT, locale);

    return Moment(date).format(timeFormat);
};

/**
 * Formats a number and outputs it in the country's percentage format standards. If not present falls to default
 * Language of the server and if that is also missing it uses a configuration preset format.
 *
 * @param {Number} number the number to be formatted in percentage context
 * @param {String} locale the language in which you want to format the percentage
 * @returns {String} the formatted percentage in the desired language
 */
Format.prototype.formatPercentage = function (number, locale) {

    number = this._precise_round(number, 2);
    number = this.formatNumber(number, locale);

    var arguments = [];
    arguments.push(number);

    return this.translate('percentage.format', DEFAULT_PERCENTAGE_FORMAT, locale, arguments);
};

/**
 * Formats a number and outputs in the country's currency format standards. If not present falls to default
 * Language of the server and if that is also missing it uses a configuration preset format.
 *
 * @param {Number} number the number to be formatted in currency context
 * @param {String} locale the language in which you want to format the currency
 * @returns {String} the formatted currency in the desired language
 */
Format.prototype.formatCurrency = function (number, locale) {

    number = this._precise_round(number, 2);
    number = this.formatNumber(number, locale);

    var arguments = [];
    arguments.push(number);

    return this.translate('currency.format', DEFAULT_CURRENCY_FORMAT, locale, arguments);
};

/**
 * Formats a given number taking into account the decimals and the thousands. If not present falls to default
 * Language of the server and if that is also missing it uses a configuration preset format.
 *
 * @param {Number} value the value that you want to format
 * @param {String} locale the language in which you want to format the number
 * @returns {String} the formatted number in the desired language
 */
Format.prototype.formatNumber = function (value, locale) {
    value = value.toString().split('.');

    //translate depending on the language the decimal
    var thousandPattern = /\B(?=(\d{3})+(?!\d))/g;
    value[0] = value[0].replace(thousandPattern,
        this.translate('thousand.separator', DEFAULT_THOUSAND_SEPARATOR, locale));

    value = value.join(this.translate('decimal.separator', DEFAULT_DECIMAL_SEPARATOR, locale));

    return value;

};

/**
 * Rounds a number with the desired number of decimals. If not present falls to default Language of the server
 * and if that is also missing it uses a configuration preset format.
 *
 * @param {Number} number the number that you want to make the precise round on
 * @param {Number} decimals the number of decimals you want to round up to
 * @returns {Number} the rounded up number to the desired decimals number
 * @private
 */
Format.prototype._precise_round = function (number, decimals) {
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Depending on the user preferences this method changes the language to the standards
 * moment.js languages.
 *
 * @param {String} locale the language set by the user
 * @returns {String} the language to the moment.js map of languages
 * @private
 */
Format.prototype._getMomentLang = function (locale) {
    var momentLanguage;

    switch (locale) {
        case "en_US":
            momentLanguage = 'en-gb';
            break;
        case "en_CA":
            momentLanguage = 'en-ca';
            break;
        case "fr_CA":
            momentLanguage = 'fr-ca';
            break;
        default:
            locale = locale.split('_');
            momentLanguage = locale[0];
            break;
    }

    return momentLanguage;
};

/**
 * Searches if a messageId is located in the jed translation object.
 *
 * @param {Jed} jed the jed translation
 * @param {String} customId the customId of the message
 * @returns {boolean} true or false if the customId was found.
 * @private
 */
Format.prototype._msgIdExists = function (jed, customId) {

    var domain = jed.textdomain(),
        data = jed.options.locale_data[domain],
        list = data[customId];

    if (list) {
        return true;
    }

    return false;
};

module.exports = Format;
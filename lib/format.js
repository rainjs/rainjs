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
 * Format module that formats date/time/date-range/numbers depending on the language.
 * Extra description.....
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


    // If no locale was found we create an empty instance to enable the default behavior of gettext:
    // it returns msgId if count equals 1 or msgIdPlural otherwise.
    // In this way, the program is working without any translation files.

    try {
        return jed.translate(customId).fetch(arguments);
    } catch (err) {
        logger.error(util.format('A translation error occurred: %s, ' +
            'moduleId = %s, language = %s. ' +
            'msgId = %s, msgIdPlural = %s, count = %s, args = %s',
            err, id, language, msgId, msgIdPlural, count, args));
        return 'A translation error occurred.';
    }
};

Format.prototype._msgIdExists = function (jed, customId) {

    var domain = jed.textdomain(),
        data = jed.options.locale_data[domain],
        list = data[customId];

    if (list) {
        return true;
    }

    return false;
};

/**
 *
 * @param {String} startDate the start date of the range
 * @param {String} endDate the end date of the range
 * @param {String} locale the language in which you want to format
 * @returns {String} the formated range in the desired language
 */
Format.prototype.formatRange = function (startDate, endDate, locale) {

    var startDay = startDate.getDate(),
        endDay = endDate.getDate(),
        startMonth = startDate.getMonth(),
        endMonth = endDate.getMonth(),
        startYear = startDate.getFullYear(),
        endYear = endDate.getFullYear(),
        output;

    //if translation availabe for moment but no formating available on server conf
    //what should be done
    Moment.lang(config.momentMap[locale]);

    if(!config.timeFormat[locale]) {
        locale = config.defaultLanguage;
    }
    if(endYear === startYear) {
        output = this.formatDate(startDate, locale, 'MMMM DD') + ' - ' +
            this.formatDate(endDate, locale, config.timeFormat[locale].interval);
    } else if (endYear !== startYear) {
        output = this.formatDate(startDate, locale, config.timeFormat[locale].interval) + ' - ' +
            this.formatDate(endDate, locale, config.timeFormat[locale].interval);
    }

    return output;

};

/**
 *
 * @param {String} date the date that you want to format
 * @param {String} locale the language in which you want to format the date
 * @param {String} [format] optional parameter of the way to format the date
 * @returns {String} the formated date in the desired language
 */
Format.prototype.formatDate = function (date, locale, format) {

    //set a moment language mapping here depending on the locale
    Moment.lang(config.momentMap[locale]);

    if(!format) {
        if(!config.timeFormat[locale]) {
            locale = config.defaultLanguage;
        }
        return Moment(date).format(config.timeFormat[locale].date);
    } else {
        return Moment(date).format(format);
    }
};

/**
 *
 * @param {String} date the date for which you want the time format
 * @param {String} locale the language in which you want to format the time
 * @returns {String} the formated time in the desired language
 */
Format.prototype.formatTime = function (date, locale) {

    //what happens if I have the mapped language in moment but I don't have a format
    //for how the time should look
    Moment.lang(config.momentMap[locale]);

    if(!config.timeFormat[locale]) {
        locale = config.defaultLanguage;
    }

    return Moment(date).format(config.timeFormat[locale].time);
};

/**
 *
 * @param {Number} number the number to be formatted in percentage context
 * @param {String} locale the language in which you want to format the percentage
 * @returns {String} the formated percentage in the desired language
 */
Format.prototype.formatPercentage = function (number, locale) {

    number = this._precise_round(number,2);
    number = this.formatNumber(number, locale);

    var arguments = [];
    arguments.push(number);

    return this.translate('percentage.format', '%s%%', locale, arguments);
};

/**
 *
 * @param {Number} number the number to be formatted in currency context
 * @param {String} locale the language in which you want to format the currency
 * @returns {String} the formated currency in the desired language
 */
Format.prototype.formatCurrency = function (number, locale) {

    number = this._precise_round(number, 2);
    number = this.formatNumber(number, locale);

    var arguments = [];
    arguments.push(number);

    return this.translate('currency.format', "%s$", locale, arguments);

    //format the currency
};

/**
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
 *
 * @param {Number} value the value that you want to format
 * @param {String} locale the language in which you want to format the number
 * @returns {String} the formated number in the desired language
 */
Format.prototype.formatNumber = function (value, locale) {
    value = value.toString();

    //translate depending on the language the decimal
    value = value.replace('.', this.translate('decimal.separator', ',', locale));


    var thousandPattern = /\B(?=(\d{3})+(?!\d))/g;

    //translate depending on the pattern the thousand separator
    return value.replace(thousandPattern, this.translate('thousand.separator', '.', locale));

};

/*
frm = new Format();
console.log(frm.formatDate(new Date(2012, 2, 23, 14, 45), 'en_US'));
console.log(frm.formatTime(new Date(2012, 2, 23, 14, 45), 'en_US'));
console.log(frm.formatRange(new Date(2012, 2, 20), new Date(2013, 2, 27), 'en_US'));
console.log(frm.formatCurrency(1234.5, 'en_US'));
console.log(frm.formatPercentage(24.5, 'en_US'));
console.log(frm.translate('thousand.separator', '.', 'en_US'));
console.log(frm.translate('currency.format', '$', 'en_US'));
*/

module.exports = Format;
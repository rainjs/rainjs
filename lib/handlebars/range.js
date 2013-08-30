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

var renderer = require('../renderer'),
    Formatter = require('../format');

/**
 * This Handlebars helper is used to format a date range according to the specific language.
 *
 * Syntax::
 *
 *      {{range startDate endDate}}
 *
 * @example:
 *
 *      <span>
 *          The established interval is: {{range currentDate oneMonthFromNow}}
 *      </span>
 *
 *  Output(for locale="de_DE"): Juli 16 - August 16. 2013
 *
 * @name RangeHelper
 * @constructor
 */
function RangeHelper() {}

/**
 * Formats a date range according to the language specified in the platform configuration.
 *
 * @param {Object} startDate the first date from date range
 * @param {Object} endDate the second date from the date range
 *
 * @returns {String} the formatted date range
 */
RangeHelper.prototype.helper = function (startDate, endDate) {
    var language = renderer.rain.environment.language,
        formatter = Formatter.get();

    return formatter.formatRange(startDate, endDate, language);
};

module.exports = {
    name: 'range',
    helper: new RangeHelper().helper
};

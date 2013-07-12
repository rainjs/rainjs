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

var languageUtils = require('./lib/language_utils');
var Formatter = require('../../../lib/format');

/**
 * Handles the template data for the view index and returns it with invoking the callback function.
 *
 * @param {Object} environment information about the environment context
 * @param {Function} callback the callback function which must be invoked if the data is completely build
 * @param {Object} context the context of the template
 */
function index(environment, callback, context) {
    var error = null;
    var customData = null;

    callback(error, customData);
}

function notes(environment, callback, context, request) {
    var data = {
        notes: request.session.get('notes') || []
    };

    callback(null, data);
}

function level1(environment, callback, data) {
    callback(null, data);
}

function level2(environment, callback, data) {
    setTimeout(function () {
        callback(null, data);
    }, Math.floor(Math.random() * 1500));
}

function level3(environment, callback, data) {
    setTimeout(function () {
        callback(null, data);
    }, Math.floor(Math.random() * 3000));
}

function platform_language(env, fn, ctx) {
    var when = require('promised-io/promise').when,
        Map = require('./lib/map'),
        countries = require('./lib/map_countries');

    // extract ISO-3166-1 alpha2 country code
    var code = env.language.slice(env.language.lastIndexOf('_') + 1).toLowerCase();
    // correct for uk
    if (code === 'uk') { code = 'gb'; }

    var map = new Map(code);

    // load the map and pass data to template or signal error
    when(map.load(),
        function (src) {
            fn(null, {
                src: src,
                country: countries[code]
            });
        },
        fn.bind(null, {error: true})
    );
}

function text_localization(environment, callback, data) {
    var customData = {
        boss: {
            title: 'Mr.',
            lastName: 'Doe'
        },
        company: 'ABC Company',
        months: 5,
        firstName: 'John',
        lastName: 'Smith',
        email: 'jsmith@abcd.com',
        phone: '(111) 111-1111',
        sendButtonLabel: languageUtils.translateSendMail()
    };
    callback(null, customData);
}

function format_helpers(environment, callback, data) {
    var formatter = Formatter.get();
    var lang = environment.language;
    var today = new Date();
    var oneMonthInterval =
        formatter.formatRange(today, new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()), lang);

    var customData = {
        currentLocale: lang,
        currentDate: today,
        oneWeekFromNow: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
        oneYearFromNow: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()),
        oneMonthInterval: oneMonthInterval,
        decimalNumberSample: formatter.formatNumber(7.44517, lang)
    };

    callback(null, customData);
}

function flowLayout(environment, callback, context, request) {
    var data = {
        notes: request.session.get('notes') || []
    };

    callback(null, data);
}

function partials(environment, callback, context, request) {
    var adsPartials = request.partials.filter(function (path) {
        return path.indexOf('ads/') === 0;
    });

    var index = Math.floor(Math.random() * adsPartials.length);

    var data = {
        user: {
            name: 'John doe',
            email: 'john.doe@example.com',
            phone: '+40729555999',
            template: 'user'
        },
        adsPath: adsPartials[index]
    };

    callback(null, data);
}

module.exports = {
    index: index,
    notes: notes,
    level1: level1,
    level2: level2,
    level3: level3,
    platform_language: platform_language,
    text_localization: text_localization,
    format_helpers: format_helpers,
    'layout/flow': flowLayout,
    partials: partials
};

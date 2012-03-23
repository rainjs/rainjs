"use strict";

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

function data_layer(environment, callback, context) {
    var data = {
        category: 'JavaScript Books',
        items: [
            {
                author: 'David Sawyer McFarland',
                title: 'JavaScript & jQuery: The Missing Manual',
                year: 2011
            },
            {
                author: 'Douglas Crockford',
                title: 'JavaScript: The Good Parts',
                year: 2008
            },
            {
                author: 'Stoyan Stefanov',
                title: 'JavaScript Patterns ',
                year: 2010
            },
            {
                author: 'Marijn Haverbeke',
                title: 'Eloquent JavaScript: A Modern Introduction to Programming',
                year: 2011
            },
            {
                author: 'John Resig',
                title: 'Secrets of the JavaScript Ninja',
                year: 2012
            }
        ]
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

module.exports = {
    index: index,
    data_layer: data_layer,
    level1: level1,
    level2: level2,
    level3: level3,
    platform_language: platform_language
};

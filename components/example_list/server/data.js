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
        sendButtonLabel: t('Send email')
    };
    callback(null, customData);
}

module.exports = {
    index: index,
    data_layer: data_layer,
    level1: level1,
    level2: level2,
    level3: level3,
    text_localization: text_localization
};

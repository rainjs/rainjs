"use strict";

/**
 * Handles the template data for the view index and returns it with invoking the callback function
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
            {author: 'David Sawyer McFarland', title: 'JavaScript & jQuery: The Missing Manual', year: 2011},
            {author: 'Douglas Crockford', title: 'JavaScript: The Good Parts', year: 2008},
            {author: 'Stoyan Stefanov', title: 'JavaScript Patterns ', year: 2010},
            {author: 'Marijn Haverbeke', title: 'Eloquent JavaScript: A Modern Introduction to Programming', year: 2011},
            {author: 'John Resig', title: 'Secrets of the JavaScript Ninja', year: 2012}
        ]        
    };
    
    callback(null, data);
}

module.exports = {
    index: index,
    data_layer: data_layer
};

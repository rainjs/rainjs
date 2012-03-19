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

module.exports = {
    index: index
};

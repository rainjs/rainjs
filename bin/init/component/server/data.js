"use strict";

/**
 * Handles the template data for the 'index' view and invokes the callback function with the
 * handled data.
 *
 * @param {Environment} environment information about the environment context
 * @param {Function} callback the function that must be invoked data needed by the template
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

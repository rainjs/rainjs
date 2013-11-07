"use strict";

/**
 * Handles the template data for the 'index' view and invokes the callback function with the
 * handled data.
 *
 * @param {Environment} environment information about the environment context
 * @param {String} environment.language current platform locale
 * @param {Function} callback the function that must be invoked data needed by the template
 * @param {Object} context the context of the template
 * @param {Object} request information about the current request
 * @param {connect.Session} request.session current session
 * @param {Object} request.[query] a map of request query parameters (http only)
 * @param {Object} request.[headers] a map of request headers (http only)
 * @param {String} request.[url] the full request URL (http only)
 * @param {String} request.type type of request 'http' | 'websocket'
 */
function flow(environment, callback, context, request) {
    callback(null, context);
}

module.exports = {
    flow: flow
};

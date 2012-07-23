"use strict";

/**
 * Create the languages object and pass it to the callback.
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
function index(environment, callback, context, request) {
    var languages = [];
    for (var i = 0; i < environment.languages.length; i++) {
        var language = environment.languages[i];
        languages.push({
            value: language.key,
            text: language.text,
            selected: environment.language == language.key
        });
    }
    callback(null, {
        languages: languages
    });
}

module.exports = {
    index: index
};

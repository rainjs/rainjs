'use strict';

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
function index(environment, callback, context, request) {
    var error = null;
    var customData = {images: [
        {image: 'bridge_over_a_pond_of_water_lilies.jpg', title: 'Bridge over a pond', sid: 'painting1'},
        {image: 'poppies_blooming.jpg', title: 'Poppies blooming', sid: 'painting2'},
        {image: 'sunset.jpg', title: 'Sunset', sid: 'painting3'},
        {image: 'the_boat_studio.jpg', title: 'The boat studio', sid: 'painting4'},
        {image: 'the_cliffs_at_etretat.jpg', title: 'The cliffs at Etretat', sid: 'painting5'},
        {image: 'water_lilies_2.jpg', title: 'Water lilies', sid: 'painting6'},
        {image: 'water_lilies.jpg', title: 'Water lilies', sid: 'painting7'},
        {image: 'water_lily_pond.jpg', title: 'Water lily pond', sid: 'painting8'},
        {image: 'woman_in_a_garden.jpg', title: 'Woman in a garden', sid: 'painting9'}
    ]};

    callback(error, customData);
}

module.exports = {
    index: index
};

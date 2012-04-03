"use strict";

/**
 * Handles the requests that are matching the view route
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function handle(request, response) {
    var renderer = require('../renderer');

    var component = request.component;
    var viewId = request.path;

    response.setHeader('content-type', 'text/html; charset=UTF-8');
    response.write(renderer.renderBootstrap(component, viewId, request, response));
}

module.exports = {
    name: "View Route",
    route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(.+)$/,
    handle: handle
};

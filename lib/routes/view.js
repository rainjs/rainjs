"use strict";

/**
 * The request handler
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Array} matches the matches from the route regexp
 */
function handler(request, response, matches) {
    var componentRegistry = require('../component_registry');
    var renderer = require('../renderer');
    var componentId = matches[1];
    var version = matches[2];
    var viewid = matches[3];

    if(!version){
        //get latest version if no version is given
        version = componentRegistry.getLatestVersion(componentId);
    }

    var component = componentRegistry.getConfig(componentId, version);    

    response.setHeader('content-type', 'text/html; charset=UTF-8');
    response.write(renderer.renderBootstrap(component, viewid, request, response));
}

module.exports = {
    name: "View Route",
    route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(\w+)$/,
    handler: handler
};

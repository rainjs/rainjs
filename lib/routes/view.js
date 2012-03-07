"use strict";

/**
 * The request handler
 *
 * @param request the request object
 * @param response the response object
 */
function handler(request, response, matches, next) {
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
    //Used for the renderer
    response.renderLevel = 0;
    response.renderCount = 0;

    response.setHeader('content-type', 'text/html; charset=UTF-8');
    response.write(renderer.renderBootstrap(component, viewid, request, response));
}

module.exports = {
    name: "View Route",
    route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(\w+)$/,
    handler: handler
};

"use strict";

/**
 * The request handler
 *
 * @param request the request object
 * @param response the response object
 */
function handler(request, response, matches, next) {
    var server = require('../server');
    var componentRegistry = server.componentRegistry;
    var renderer = require('../renderer');
    var componentId = matches[1];
    var version = matches[2];
    var viewid = matches[3];
    
    if(!version){
        //get latest version if no version is given
        if(version == undefined){
            version = componentRegistry.getLatestVersion(componentId);
        }
    }
    
    var component = componentRegistry.getComponent(componentId, version);
    
    response.setHeader('content-type', 'text/html; charset=UTF-8');
    response.write(renderer.renderBootstrap(component, viewid, request, response));
}

module.exports = {
    name: "View Route",
    route: /^\/(\w+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(\w+)$/,
    handler: handler,
    hasSession: true,
    hasQuery: true,
    hasBodyParser: true
};

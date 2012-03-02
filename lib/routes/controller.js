"use strict";

/**
 * This handler calls the
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Array} matches the matches from the route regexp
 * @param next
 */
function handler(request, response, matches, next) {
    var path = require('path');
    var server = require('../server');
    var componentRegistry = server.componentRegistry;
    var config = server.config;

    var componentId = matches[1];
    var version = matches[2];
    var viewid = matches[3];
    var method = request.method.toLowerCase();

//    if(version == undefined){
//        version = componentRegistry.getLatestVersion(componentId);
//    }
//
//    var component = componentRegistry.getComponent(componentId, version);
//    var controllerPath = path.join(
//        config.server.componentPath,
//        component.folder,
//        'server/controller',
//        (component.views[viewid]['s-controller'] || viewid+'.js')
//    );

    var controllerPath = path.join(config.server.componentPath, 'error', 'server/controller', viewid + '.js');
    console.log(controllerPath);
    try {
        require(controllerPath)[method](request, response);

    } catch (ex) {
        throw {
            "message": "The view " + viewid + " has no defined controller!"
        };
    }
}

module.exports = {
    name: "Controller Route",
    route: /(\w+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:controller)\/(.+)/,
    handler: handler,
    hasSession: true,
};

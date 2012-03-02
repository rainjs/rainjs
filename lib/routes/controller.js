"use strict";

var path = require('path');
var server = require('../server');
var componentRegistry = server.componentRegistry;
var config = server.config;

/**
 * This handler calls the
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Array} matches the matches from the route regexp
 * @param next
 */
function handler(request, response, matches, next) {
    var componentId = matches[1];
    var version = matches[2];
    var viewid = matches[3];
    var method = request.method.toLowerCase();

    var component = componentRegistry.getComponent(componentId, version);

    var controllerPath = path.join(
        config.server.componentPath,
        component.url,
        'server',
        (component.views[viewid]['s-controller'] || viewid+'.js'));

    try {
        require(controllerPath)[method](request, response);

    } catch(ex){
        throw {
            "message" : "The view "+viewid+" has no defined controller!"
        };
    }
}



module.exports = {
    name: "Controller Route",
    route: /\/(\w+)\/(\d\.?\d?\.?\d?)\/(?:controller)\/(\w+)/,
    handler: handler,
    hasSession: true,
};

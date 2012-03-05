"use strict";

var path = require('path');

/**
 * This handler calls the controller of a view to handle REST implementation.
 * If the controller dosn't close the connection the timeout is invoked with the
 * specified time in the server configuration.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Array} matches the matches from the route regexp
 * @param next
 */
function handler(request, response, matches, next) {
    var server = require('../server');
    var componentRegistry = server.componentRegistry;
    var config = server.config;

    var componentId = matches[1];
    var version = matches[2];
    var viewid = matches[3];
    var method = request.method.toLowerCase();

    //get latest version if no version is given
    if(version == undefined){
        version = componentRegistry.getLatestVersion(componentId);
    }


    var component = componentRegistry.getConfig(componentId, version);
    var controllerFile = (component.views[viewid] && component.views[viewid].controller && component.views[viewid].controller.server || viewid+'.js');
    var controllerPath = path.join(
        config.server.componentPath,
        component.folder,
        'server/controller',
        controllerFile
    );

    try {
        var controller = require(controllerPath);

    } catch (ex) {
        throw {
            message: 'The view "' + viewid + '" has no defined controller!',
            type: "io"
        };
    }

    if(controller[method]){
        /**
         * If the controller dosn't close the connection the timeout is invoked with the
         * specified time in the server configuration and the statusCode is set to 504.
         * This works only if no data was sent.
         * 
         * Reasons:
         *     1. Wrong implementation
         *     2. Controller is waiting for a answer from an other Service
         */
        setTimeout(function(){
            if(response.finished == false && response.connection.bytesWritten == 0){
                response.statusCode = 504;
                response.setHeader("Content-Type", "text/plain; charset=UTF-8");
                response.end();
            }
        }, server.config.server.timeoutForRequests*1000);
        controller[method](request, response);
    } else {
        throw {
            message: 'Method ' + method.toUpperCase() + ' is not implemented in '+controllerFile,
            type: "io"
        };
    }
}

module.exports = {
    name: "Controller Route",
    route: /^\/(\w+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:controller)\/(.+)/,
    handler: handler,
    hasSession: true
};

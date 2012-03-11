"use strict";

var path = require('path');
var routerUtils = require('../router_utils');

/**
 * This handler calls the controller of a view to handle REST implementation.
 * If the controller dosn't close the connection the timeout is invoked with the
 * specified time in the server configuration.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function handle(request, response) {
    var config = require('../configuration');

    var component = request.component;
    var wiewId = request.path;
    var method = request.method.toLowerCase();
    var view = component.views[wiewId];

    var controllerFile = (view && view.controller && view.controller.server) || (wiewId + '.js');
    var controllerPath = path.join(
        component.folder,
        'server/controller',
        controllerFile
    );

    try {
        var controller = require(controllerPath);
        if(controller[method]){        
            setTimeout(getTimeoutCallback(request, response), config.server.timeoutForRequests * 1000);
            controller[method](request, response);
        } else {
            routerUtils.handleError(
                new RainError(request.method + ' is not implemented', RainError.ERROR_HTTP, 404),
                request, response);
        }
    } catch (ex) {
        routerUtils.handleError(
            new RainError('The specified controller was not found!', RainError.ERROR_HTTP, 404),
            request, response);
    }
}

/**
 * If the controller doesn't close the connection the timeout is invoked with the
 * specified time in the server configuration and the statusCode is set to 504.
 * This works only if no data was sent.
 *
 * Reasons:
 *     1. Wrong implementation
 *     2. Controller is waiting for a answer from an other Service
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function getTimeoutCallback(request, response) {
    return function () {
        if (!response.finished) {
            routerUtils.handleError(
                new RainError('The controller method timed out', RainError.ERROR_HTTP, 504),
                request, response);
        }
    };
}

module.exports = {
    name: "Controller Route",
    route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:controller)\/(.+)/,
    handle: handle
};

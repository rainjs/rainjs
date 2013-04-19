// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";

var path = require('path'),
    logging = require('../logging'),
    logger = logging.get(),
    routerUtils = require('../router_utils'),
    Translation = require('../translation'),
    Environment = require('../environment'),
    moduleLoader = require('../module_loader').get(),
    util = require('util');

/**
 * This handler calls the controller of a view to handle REST implementation.
 * If the controller doesn't close the connection the timeout is invoked with the
 * specified time in the server configuration.
 *
 * The component session is set on the ``request.session`` property if the component uses session.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function handle(request, response) {
    var config = require('../configuration');

    var component = request.component,
        viewId = request.path,
        method = request.method.toLowerCase(),
        view = component.views[viewId];

    if (component.type == 'container') {
        logger.warn('The request for server-side controller "' + viewId + '" from "' +
                    component.id + ';' + component.version + '" container was ignored.');
        routerUtils.handleError(
            new RainError('Containers don\'t have server-side controllers',
                          RainError.ERROR_HTTP, 404), request, response);
        return;
    }

    var controllerFile = (view && view.controller && view.controller.server) || (viewId + '.js'),
        controllerPath = path.join(component.folder, 'server/controller', controllerFile);

    try {
        var environment = request.environment,
            language = environment.language,
            controller = moduleLoader.requireWithContext(controllerPath, component, language);

        if (controller[method]) {
            setTimeout(getTimeoutCallback(request, response), config.server.timeoutForRequests * 1000);

            response.setHeader('Cache-Control', 'no-cache, must-revalidate');
            response.setHeader('Pragma', 'no-cache');
            response.setHeader('Expires', new Date(Date.now() - 1000 * 60 * 60).toUTCString());

            // only load the session if the component needs it
            if (component.useSession) {
                request.sessionStore.get(request.sessionId, component.id).then(function (session) {
                    request.session = session;

                    var end = response.end;
                    response.end = function (data, encoding) {
                        response.end = end;

                        request.sessionStore.save(request.session).then(function () {
                            response.end(data, encoding);
                        }, function (error) {
                            logger.error(util.format('Failed to save session for: %s (%s)',
                                controllerPath, request.sessionId), error);
                            response.end(data, encoding);
                        });
                    };

                    controller[method](request, response);
                }, function (error) {
                    logger.error(util.format('Failed to retrieve session for controller %s',
                        controllerPath), error);
                    routerUtils.handleError(
                        new RainError('Failed to retrieve session', RainError.ERROR_HTTP, 500),
                        request, response);
                });
            } else {
                controller[method](request, response);
            }
        } else {
            logger.warn(util.format('The controller method %s is not implemented for %s;%s;%s.',
                                    method, component.id, component.version, viewId));
            routerUtils.handleError(
                new RainError('%s is not implemented', [request.method], RainError.ERROR_HTTP, 404),
                request, response);
        }
    } catch (err) {
        logger.error('Failed to execute controller', err);
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
            var component = request.component,
                viewId = request.path,
                method = request.method.toLowerCase();

            logger.error(util.format('The controller %s method timed out for %s;%s;%s.',
                                     method, component.id, component.version, viewId));

            // flag the timeout for the controller
            response.timeout = true;
            // return an error response
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

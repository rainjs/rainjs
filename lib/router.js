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

var fs = require('fs'),
    path = require('path'),
    url = require('url'),
    routerUtils = require('./router_utils'),
    logger = require('./logging').get();

var handlers = [],
    handlersLength = 0,
    routerPlugins = [
        'resource',
        'javascript',
        'css',
        'locale',
        'controller',
        'view'
    ],
    routesFolder = path.join(__dirname, 'routes');

/**
 * Auto discovering the routes that are handled by the router.
 */
function loadPlugins() {
    routerPlugins.forEach(function (file) {
        try {
            var plugin = require(path.join(routesFolder, file));

            registerPlugin(plugin);
        } catch (ex) {
            logger.error('Router Plugin ' + file + ' is invalid.');
        }
    });
    handlersLength = handlers.length;
}

/**
 * Register plugin to the router.
 *
 * @param {RouterPlugin} plugin the plugin which will be registered
 */
function registerPlugin(plugin) {
    if (plugin.route instanceof RegExp && typeof plugin.handle === 'function') {
        handlers.push(plugin);
    } else {
        logger.error('Error registering route ' + plugin.name);
    }
}

/**
 * This function is handled by connect and binds it with his own context.
 * It goes throw each registered plugin and executes the valid handler.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Function} next callback passed by connect that execute the next middleware when called
 */
function router(request, response, next) {
    var pathname = url.parse(request.url).pathname;

    if (!routerUtils.isValid(pathname)) {
        next(new RainError('The url is not valid!', RainError.ERROR_HTTP, 404));
        return;
    }

    for (var i = 0; i < handlersLength; i++) {
        var handler = handlers[i];
        var matches = pathname.match(handler.route);

        if (!matches) {
            continue;
        }

        // The route matched, but the component doesn't exist.
        if (!readComponentConfig(request, matches)) {
            next(new RainError('The requested component was not found!',
                               RainError.ERROR_HTTP, 404));
            return;
        }

        try {
            logger.info("Routing: " + pathname + " to:" + handler.name);
            handler.handle(request, response);
        } catch (ex) {
            next(ex);
        }
        break;
    }

    // No route was found.
    if (i === handlersLength) {
        next(new RainError('No route was found!', RainError.ERROR_HTTP, 404));
    }
}

/**
 * Reads the component info and places it on the request.
 *
 * @param {Request} request the request object
 * @param {Array} matches the array of matches for the matching route
 * @returns {Boolean} true if the component was found
 */
function readComponentConfig(request, matches) {
    var componentRegistry = require('./component_registry');

    var componentId = matches[1],
        version = matches[2],
        path = matches[3],
        language;

    if (matches.length == 5) {
        language = matches[3];
        path = matches[4];
    }

    if (!version) {
        version = componentRegistry.getLatestVersion(componentId);
    }

    var component = componentRegistry.getConfig(componentId, version);

    if (!component) {
        return false;
    }

    request.component = component;
    request.path = path;
    request.resourceLanguage = language;

    return true;
}

/**
 * Initializes the router and returns the middleware method that is used by connect
 */
module.exports = function () {
    loadPlugins();
    return router;
};

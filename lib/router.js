"use strict";

var fs = require('fs'),
    path = require('path'),
    url = require('url'),
    routerUtils = require('./router_utils');

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
            console.log('Router Plugin ' + file + ' is invalid.');
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
        console.log('Error registering route ' + plugin.name);
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
            console.log("Routing: ", pathname, " to:", handler.name);
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

    var componentId = matches[1];
    var version = matches[2];
    var path = matches[3];

    if (!version) {
        version = componentRegistry.getLatestVersion(componentId);
    }

    var component = componentRegistry.getConfig(componentId, version);

    if (!component) {
        return false;
    }

    request.component = component;
    request.path = path;

    return true;
}

/**
 * Initializes the router and returns the middleware method that is used by connect
 */
module.exports = function () {
    loadPlugins();
    return router;
};

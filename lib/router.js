"use strict";

var fs = require('fs');
var path = require('path');
var url = require('url');

var handlers = [];
var middleware = {};
var pluginFolder = path.join(__dirname, 'routes');

function initialize() {
    loadPlugins();
};

/**
 * Auto discovering / loading of router plugins
 */
function loadPlugins() {
    try {
        var dir = fs.readdirSync(pluginFolder);
    } catch (e) {
        return;
    }

    dir.forEach(function(file) {
        try {
            var plugin = require(path.join(pluginFolder, file));

            registerPlugin(plugin);
        } catch (ex) {
            console.log('Router Plugin ' + file + 'is invalid.');
        }
    });
};

/**
 * Register plugin to the router
 *
 * @param {RouterPlugin} plugin plugin which will be registered
 */
function registerPlugin(plugin) {
    if (!(plugin.route instanceof RegExp)) {
        console.trace('Error registering plugin ' + plugin.name + ': the plugin route is not a RegExp');
        return;
    }

    if (typeof plugin.handler !== 'function') {
        console.trace('Error registering plugin ' + plugin.name + ': the plugin handler is not a Function');
        return;
    }

    handlers.push(plugin);
    console.info("Loaded router plugin: " + plugin.name);
};

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
    var found = false;
    //restriction with ../ paths
    if(!~pathname.search(/\.\.\//)){
        for (var i = handlers.length; i--;) {
            var handler = handlers[i];
            var matches = pathname.match(handler.route);
            if (matches) {
                try {
                    console.debug("Routing: ", pathname, " to:", handler.name);
                    handler.handler(request, response, matches, next);
                } catch (ex) {
                    console.log(ex);
                    next(ex);
                }

                found = true;
                break;
            }

        }
    }
    if (!found) {
        console.log("No routing found!");
        next(new RainError('No route was found!', RainError.ERROR_HTTP, 404));
    }
};

/**
 * Initializes the router and returns the middleware method that is used by connect
 */
module.exports = function() {
    initialize();
    return router;
};

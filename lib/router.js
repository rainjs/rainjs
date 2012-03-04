"use strict";

var fs = require('fs');
var path = require('path');
var url = require('url');

var handlers = [];
var middleware = {};

function initialize() {
    loadPlugins();
};

/**
 * Auto discovering / loading of router plugins
 */
function loadPlugins() {
    try {
        var dir = fs.readdirSync(path.join(__dirname, 'routes'));
    } catch (e) {
        return;
    }

    dir.forEach(function(file) {
        try {
            var plugin = require(path.join(__dirname, 'routes', file));

            registerPlugin(plugin);
        } catch (ex) {
            throw {
                message: 'Plugin ' + file + 'is invalid.'
            };
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
 * This function is handled buy connect and binds it with his own context.
 * It goes throw each registered plugin and executes the valid handler.
 *
 * @param {Request} request
 * @param {Response}response
 * @param {Process.nextTick} next
 */
function router(request, response, next) {
    var pathname = url.parse(request.url).pathname;
    var found = false;
    for ( var i = handlers.length; i--;) {
        var handler = handlers[i];
        var matches = pathname.match(handler.route);
        if (matches) {
            for ( var key in middleware) {
                var plugin = middleware[key];
                if (key == 'session' && !handler.hasSession) {
                    break;
                }

                plugin(request, response, function() {
                });
            }

//            try {
                handler.handler(request, response, matches, next);
//            } catch (ex) {
//                throw {
//                    name: "Router Error",
//                    message: "Error in the handler of the router plugin: " + handler.name
//                };
//            }

            found = true;
            break;
        }

    }
    if (!found) {
        console.log("No routing found!");
        next();
    }
};

module.exports = function(plugins) {
    middleware = plugins;

    initialize();
    return router;
};

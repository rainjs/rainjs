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
            throw {
                message: 'Router Plugin ' + file + 'is invalid.'
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
    //restriction with ../ paths
    if(!~pathname.search(/\.\.\//)){
        for ( var i = handlers.length; i--;) {
            var handler = handlers[i];
            var matches = pathname.match(handler.route);
            if (matches) {
                for ( var key in middleware) {
                    var plugin = middleware[key];
                    var propertyName = 'has'+key.charAt(0).toUpperCase()+key.substring(1);

                    // check for the has<MiddlewareName> key on the handler
                    if(handler[propertyName] && handler[propertyName] === true){
                        plugin(request, response, function() {});
                    }
                }

                try {
                    console.debug("Routing: ", pathname, " to:", handler.name);
                    handler.handler(request, response, matches, next);
                } catch (ex) {
                    throw {
                        name: "Router Error",
                        message: "Error in the handler of the router plugin: " + handler.name
                    };
                }

                found = true;
                break;
            }

        }
    }
    if (!found) {
        console.log("No routing found!");
        next();
    }
};

/**
 * Factory method for the routing middleware that accepts a map containing middleware for the plugin.
 *
 * The map should contain a set of middleware that will be added to the router. Once you add a middleware
 * to the router the ``has<MiddlewareKey>`` will become available to all routes as a boolean value that
 * will toggle that middleware on or off when the route's regex get matched.
 *
 * @param {Object} plugins Connect middleware plugins which are automatically integrated into the router plugins
 * @example
 *      // in the server.js
 *      router({
 *          query: connect.query()
 *      });
 *
 *      // and now you will have the hasQuery parameter available in all your middleware
 *      // for example in the resource handler
 *
 *      module.exports = {
 *          name: 'Resource Route',
 *          route: /^(.*)$/,
 *          handler: function () {},
 *          hasQuery: true
 *      }
 */
module.exports = function(plugins) {
    middleware = plugins;

    initialize();
    return router;
};

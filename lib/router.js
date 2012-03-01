"use strict";

var fs = require('fs');
var path = require('path');
var url = require('url');
var self = null;

var PluggableRouter = function(){
    this.handlers = [];
    this.initilize();
};

PluggableRouter.prototype.initilize = function(){
    this.loadPlugins();
};

PluggableRouter.prototype.loadPlugins = function(){
    var dir = fs.readdirSync(__dirname + '/router_plugins');
    var self = this;

    dir.forEach(function (file) {
        try {
            var plugin = require(path.join(__dirname, 'router_plugins', file));

            self.registerPlugin(plugin);
            console.info("Loaded router plugin: " + plugin.name);
        } catch(ex){
            console.error(ex);
        }
    });
};

PluggableRouter.prototype.registerPlugin = function(plugin){
    this.handlers.push(plugin);
};

/**
*
*
* @param request
* @param response
* @param next
*/
PluggableRouter.prototype.router = function(request, response, next){
    var pathname = url.parse(request.url).pathname;
    var handlers = self.handlers;
    var found = false;
    for(var i = handlers.length; i--;){
        console.log(handlers[i].route.test(pathname));
        if(handlers[i].route.test(pathname) == true){
            handlers[i].handler(request, response, next);
            found = true;
        }
    }
    if(!found){
        console.log("No routing found!");
        next();
    }
};

self = new PluggableRouter();

module.exports = self.router;

"use strict";

var fs = require('fs');
var path = require('path');
var url = require('url');
var self = null;

var Router = function() {
    this.handlers = [];
    this.initilize();
};

Router.prototype.initilize = function() {
    this.loadPlugins();
};

Router.prototype.loadPlugins = function() {
    try {
        var dir = fs.readdirSync(path.join(__dirname, 'routes'));
    } catch (e) {
        return;
    }
    var self = this;

    dir.forEach(function (file) {
        try {
            var plugin = require(path.join(__dirname, 'routes', file));

            self.registerPlugin(plugin);
            console.info("Loaded router plugin: " + plugin.name);
        } catch(ex){
            console.error(ex);
        }
    });
};

Router.prototype.registerPlugin = function(plugin) {
    this.handlers.push(plugin);
};

Router.prototype.router = function(request, response, next) {
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
    if(!found) {
        console.log("No routing found!");
        next();
    }
};

self = new Router();

module.exports = self.router;

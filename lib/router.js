/*
Copyright (c) 2011, Mitko Tschimev <mitko.tschimev@1und1.de>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

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
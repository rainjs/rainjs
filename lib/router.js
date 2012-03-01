/*
Copyright (c) 2012, Mitko Tschimev

The Regents of the University of California. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

    Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    All advertising materials mentioning features or use of this software must display the following acknowledgement: “This product includes software developed by the University of California, Berkeley and its contributors.”
    Neither the name of the University nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS “AS IS” AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE FOR ANYDIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

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

    dir.forEach(function(file) {
        try {
            var plugin = require(path.join(__dirname, 'routes', file));

            self.registerPlugin(plugin);
            console.info("Loaded router plugin: " + plugin.name);
        } catch (ex) {
            console.error(ex);
        }
    });
};

Router.prototype.registerPlugin = function(plugin) {
    this.handlers.push(plugin);
};

/**
 * This function is handled buy connect and binds it with his own context. It
 * goes throw each registered plugin and executes the valid handler.
 *
 * @param {Request} request
 * @param {Response}response
 * @param {Process.nextTick} next
 */
Router.prototype.router = function(request, response, next) {
    var pathname = url.parse(request.url).pathname;
    var handlers = self.handlers;
    var found = false;
    for ( var i = handlers.length; i--;) {
        var handler = handlers[i];
        if (~pathname.search(handler.route)) {
            try {
                handler.handler(request, response, next);
            } catch (ex) {
                throw new Error("Error in the handler of the router plugin: " + handler.name);
            }
            found = true;
            break;
        }

    }
    if (!found) {
        console.log("No routing found!");
        next();
    }
};

self = new Router();

module.exports = self.router;


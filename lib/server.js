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

// Initialize global objects
var logger = require('./logger');
require('./globals');

var fs = require('fs');
var program = require('commander');

var config = require('./configuration');
var componentRegistry = require('./component_registry');
var connect = require('connect');
var router = require('./router');
var util = require('util');
var io = require('socket.io');
var path = require('path');

var ProxyStore = require('./proxy_store');

var routerUtils = require('./router_utils');

/**
 * Configures the server components and starts it.
 *
 * @name Server
 * @class Starts a RAIN server.
 * @constructor
 *
 * @property {Configuration} config the server configuration
 */
function Server() {
}

/**
 * Starts the server.
 *
 * @param {Server} self the class instance
 * @param {String} configPath the server configuration path
 * @private
 * @memberOf Server#
 */
Server.prototype.initialize = function () {
    var LocalStore, RemoteStore;
    try {
        LocalStore = config.session && config.session.local
                     ? require(path.join(process.cwd(), config.session.local))
                     : null;
    } catch (e) {
        console.error("Can't load LocalStore plugin");
    }
    try {
        RemoteStore = config.session && config.session.remote
                      ? require(path.join(process.cwd(), config.session.remote))
                      : null;
    } catch (e) {
        console.error("Can't load RemoteStore plugin");
    }

    var sessionStore = new ProxyStore(LocalStore, RemoteStore);
    var server = connect()
        .use(connect.favicon())
        .use(connect.cookieParser('let it rain ;)'))
        .use(connect.session({
            key: 'rain.sid',
            secret: 'let it rain ;)',
            store: sessionStore,
            cookie: {
                path: '/',
                httpOnly: false
            }
        }))
        .use(connect.query())
        .use(connect.bodyParser())
        .use(router())
        .use(function (err, req, res, next) {
            routerUtils.handleError(err, req, res);
        })
        .listen(config.server.port);

    this.socket = io.listen(server, {'log level': 2});
    this.sessionStore = sessionStore;
    componentRegistry.initialize();
    console.log("Server started");
    //watch files
    require('./watcher').initialize();
};

module.exports = new Server();

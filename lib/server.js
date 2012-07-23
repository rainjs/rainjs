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
require('./globals');

var config = require('./configuration');
var logger = require('./logging').get();
var componentRegistry = require('./component_registry');
var router = require('./router');
var ProxyStore = require('./proxy_store');
var routerUtils = require('./router_utils');

var fs = require('fs');
var program = require('commander');
var util = require('util');
var io = require('socket.io');
var path = require('path');
var connect = require('connect');

/**
 * Configures the server components and starts it.
 *
 * @name Server
 * @class Starts a RAIN server.
 * @constructor
 *
 * @property {Configuration} config the server configuration
 */
function Server() {}

/**
 * Starts the server.
 *
 * @memberOf Server#
 */
Server.prototype.start = function () {
    var Store, session;
    try {
        Store = config.session && config.session.store ?
                    require(path.join(process.cwd(), config.session.store))
                    : null;
    } catch (e) {
        throw new RainError('Failed to load session store.', RainError.ERROR_IO);
    }
    try {
        session = config.session && config.session.middleware ?
                    require(path.join(process.cwd(), config.session.middleware))
                    : connect.session;
    } catch (e) {
        throw new RainError('Failed to load session middleware.', RainError.ERROR_IO);
    }

    var sessionStore = new ProxyStore(Store, {
        path: '/',
        httpOnly: true
    });

    this.httpServer = connect()
        .use(connect.favicon())
        .use(connect.cookieParser('let it rain ;)'))
        .use(session({
            key: 'rain.sid',
            secret: 'let it rain ;)',
            store: sessionStore,
            cookie: {
                path: '/',
                httpOnly: true
            }
        }))
        .use(connect.query())
        .use(connect.bodyParser())
        .use(router())
        .use(function (err, req, res, next) {
            routerUtils.handleError(err, req, res);
        })
        .listen(config.server.port);

    this.socket = io.listen(this.httpServer, {
        logger: logger
    });
    this.sessionStore = sessionStore;
    componentRegistry.initialize();

    var socketHandlers = require('./socket_handlers');
    socketHandlers.register();

    logger.info("Server started");
};

/**
 * Softly shuts down the server closing any open pipes and connections.
 *
 * @param {Error} [error] the error that triggered the shutdown (if any)
 */
Server.prototype.close = function (error) {
    var self = this;
    if (error) {
        logger.fatal('The server has encountered an error: ' + error.stack);
    }

    try {
        var clients = this.socket.sockets.clients();

        for (var i = clients.length; i--;) {
            clients[i].disconnect();
        }

        this.httpServer.close(function () {
            logger.info('The server has been shut down');
            logger.destroy();
        });
        logger.info('Shutting down...');
    } catch (ex) {
        process.exit();
    }
};

module.exports = new Server();

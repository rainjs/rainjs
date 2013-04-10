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

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    program = require('commander'),
    io = require('socket.io'),
    connect = require('connect'),
    config = require('./configuration'),
    logging = require('./logging'),
    logger = logging.get(),
    componentRegistry = require('./component_registry'),
    router = require('./router'),
    routerUtils = require('./router_utils'),
    monitoring = require('./monitoring').Inspector.get(),
    //zabbix = require('./monitoring').Adapter.get(),

    // middlewares
    session,
    internationalisation,
    identity;

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
    if (config.configurationError) {
        throw config.configurationError;
    }
}

/**
 * Starts the server.
 *
 * @memberOf Server#
 */
Server.prototype.start = function () {
    var Store, storeOptions;
    try {
        if (config.session && config.session.store) {
            var store = config.session.store;
            if (typeof store === 'string') {
                Store = require(path.join(process.cwd(), store));
            } else {
                Store = require(store.path);
                storeOptions = store.options;
            }
        } else {
            Store = require('./mongodb/session_store');
            storeOptions = {
                'host': '127.0.0.1',
                'port': 27017,
                'database': 'rain'
            };
        }
    } catch (err) {
        logger.fatal('Failed to load the session store.', err);
        throw new RainError('Failed to load session store.', RainError.ERROR_IO);
    }

    var sessionStore = new Store(storeOptions);

    session = require('./middleware/session');
    internationalisation = require('./middleware/internationalisation');
    identity = require('./middleware/identity');

    this.httpServer = connect()
        .use(connect.favicon())
        .use(connect.cookieParser(config.cookieSecret))
        .use(connect.query())
        .use(connect.bodyParser())
        .use(router())
        .use(session.getHandle({
            store: sessionStore,
            cookie: {
                path: '/',
                httpOnly: true,
                maxAge: config.cookieMaxAge && config.cookieMaxAge * 1000
            }
        }))
        .use(internationalisation())
        .use(identity())
        .use(function callRouteHandler(request, response, next) {
            var route = request.rainRoute;
            if (route) {
                delete request.route;
                route.handle(request, response);
            } else {
                next();
            }
        })
        .use(function (err, req, res, next) {
            routerUtils.handleError(err, req, res);
        })
        .listen(config.server.port);

    this.socket = io.listen(this.httpServer, {
        logger: logging.get('socketIO')
    });

    this.sessionStore = sessionStore;
    componentRegistry.initialize();

    var socketHandlers = require('./socket_handlers');
    socketHandlers.register();

    logger.info('Server started');
};

/**
 * Renames the actual log file and restarts the logger;
 */
Server.prototype.logRotate = function () {
    logging.rotate();
};

/**
 * Softly shuts down the server closing any open pipes and connections.
 *
 * @param {Error} [error] the error that triggered the shutdown (if any)
 */
Server.prototype.close = function (error) {
    var self = this;

    if (error) {
        logger.fatal('The server has encountered an error: ' + (error && error.stack));
        monitoring.registerEvent('fatalErrors');
    }

    console.log('serverClose');
    monitoring.close().addBoth(function () {
        console.log('promise resolved');git 
        try {
            var clients = this.socket.sockets.clients();

            for (var i = clients.length; i--;) {
                clients[i].disconnect();
            }

            self.httpServer.close(function () {
                self.sessionStore && self.sessionStore.shutdown && self.sessionStore.shutdown();
                logger.info('The server has been shut down.');
                logging.destroyAll();
            });

            logger.info('Shutting down...');
        } catch (err) {
            process.exit();
        }
    });
};

module.exports = new Server();

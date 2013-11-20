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
    router = require('./middleware/router'),
    handleHttpMethods = require('./middleware/handleHttpMethods'),
    socketWatcher = require('./socket_watcher').get(),
    routerUtils = require('./router_utils'),
    monitoring,

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
    monitoring = require('./monitoring').Monitoring.get();
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
            Store = require('./session/stores/mongodb');
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

    var cookie = {
        path: '/',
        httpOnly: true,
        maxAge: config.cookieMaxAge && config.cookieMaxAge * 1000,
        secure: config.cookieSecure
    };

    var sessionHandle = session.getHandle({
        store: sessionStore,
        cookie: cookie
    });

    var app = connect()
        .use(handleHttpMethods())
        .use(connect.favicon())
        .use(connect.cookieParser(config.cookieSecret))
        .use(connect.query())
        .use(connect.bodyParser())
        .use(router())
        .use(function (request, response, next) {
            if (request.rainRoute && request.rainRoute.routeName === 'view') {
                var useCase = monitoring.registerTld('viewRequests', request.headers.host);
                var id = monitoring.startMeasurement(useCase);
                response.on('finish', function () {
                    monitoring.endMeasurement(useCase, id);
                });
            }
            next();
        })
        .use(sessionHandle)
        .use(internationalisation())
        .use(identity())
        .use(function callRouteHandler(request, response, next) {
            var route = request.rainRoute;
            if (route) {
                delete request.route;
                try {
                    route.handle(request, response);
                }
                catch (err) {
                    if (err.code === 404) {
                        next();
                    } else {
                        next(err);
                    }
                }
            } else {
                next();
            }
        });

    if (config.staticFiles) {
        var maxAge = config.staticFiles.maxAge ? config.staticFiles.maxAge * 1000 : 0;
        if (config.staticFiles.folders) {
            var folders = config.staticFiles.folders;

            Object.keys(folders).forEach(function (key) {
                app.use(key,
                    connect.static(path.resolve(process.cwd(), folders[key]), {maxAge: maxAge}));
            });
        }
    }

    app.use(function (request, response, next) {
        request.resourceNotFound = true;
        next();
    })
    .use(sessionHandle)
    .use(internationalisation())
    .use(identity())
    .use(function (request, response, next) {
        routerUtils.handleNotFound(request, response);
    })
    .use(function (err, req, res, next) {
        routerUtils.handleError(err, req, res);
    });

    this.httpServer = app.listen(config.server.port);

    this.socket = io.listen(this.httpServer, {
        logger: logging.get('socketIO')
    });

    this.socket.set('transports', ['websocket', 'xhr-polling', 'jsonp-polling']);

    socketWatcher.configure(this.socket);

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

    monitoring.close().addBoth(function () {
        try {
            var clients = self.socket.sockets.clients();

            for (var i = clients.length; i--;) {
                clients[i].disconnect();
            }

            self.httpServer.close(function () {
                self.sessionStore && self.sessionStore.shutdown && self.sessionStore.shutdown();
                logger.info('The server has been shut down.');
                logging.destroyAll();
                //should verify if the logger has finished appending than call process.exit()
            });

            logger.info('Shutting down...');

        } catch (err) {
            process.exit();
        }
    });
};

module.exports = new Server();

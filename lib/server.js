"use strict";

// Initialize global objects
require('./globals');
var logger = require('./logger');

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
function Server() {}

/**
 * Starts the server.
 *
 * @memberOf Server#
 */
Server.prototype.initialize = function () {
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
        httpOnly: false
    });

    var server = connect()
        .use(connect.favicon())
        .use(connect.cookieParser('let it rain ;)'))
        .use(session({
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
    //require('./watcher').initialize();
};

module.exports = new Server();

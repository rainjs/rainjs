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
};

module.exports = new Server();

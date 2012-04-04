"use strict";

// Initialize global objects
require('./globals');

var fs = require('fs');
var program = require('commander');

//initializes the command line options
//program
//    .version(JSON.parse(fs.readFileSync('package.json', 'utf8')).version)
//    .option('-c, --conf <file>', 'specify the configuration file')
//    .option('-d, --debug', 'debug server')
//    .parse(process.argv);

var config = require('./configuration');
var componentRegistry = require('./component_registry');
var connect = require('connect');
var router = require('./router');
var util = require('util');
var io = require('socket.io');
var logger = require('./logger');

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
    var sessionStore = new ProxyStore();
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

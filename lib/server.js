"use strict";

// Initialize global objects
require('./globals');

var fs = require('fs');
var program = require('commander');

//initializes the command line options
program
    .version(JSON.parse(fs.readFileSync('package.json', 'utf8')).version)
    .option('-c, --conf <file>', 'specify the configuration file')
    .option('-d, --debug', 'debug server')
    .parse(process.argv);

var config = require('./configuration');
var componentRegistry = require('./component_registry');
var connect = require('connect');
var router = require('./router');
var util = require('util');
var logger = require('./logger');
var io = require('socket.io');

var MemoryStore = require('connect/lib/middleware/session/memory');

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
    var server = connect()
        .use(connect.cookieParser('let it rain ;)'))
        .use(router({
            session: connect.session({
                key: 'rain.sid',
                secret: 'let it rain ;)',
                store: new MemoryStore(),
                cookie: {
                    path: '/',
                    httpOnly: false
                }
            }),
            query: connect.query(),
            bodyParser: connect.bodyParser()
        })).listen(config.server.port);
    this.socket = io.listen(server);
    componentRegistry.initialize();
    console.log("Server started");
};

module.exports = new Server();

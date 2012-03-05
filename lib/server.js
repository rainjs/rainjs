"use strict";

// Initialize global objects
require('./globals');

var fs = require('fs');
var program = require('commander');

//initializes the command line options
program
    .version(JSON.parse(fs.readFileSync('package.json', 'utf8')).version)
    .option('-c, --conf <file>', 'specify the configuration file')
    .parse(process.argv);

var connect = require('connect');
var configuration = require('./configuration');
var handlebars = require('./handlebars');
var router = require('./router');
var componentRegistry = require('./component_registry');
var logger = require('./logger');
var util = require('util');

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
    this.config = configuration;
    this.componentRegistry = componentRegistry;

    configureServer(this);
    start(this);
}

/**
 * Configure the server sub-components.
 *
 * @param {Server} self the class instance
 * @private
 * @memberOf Server#
 */
function configureServer(self) {
    // TODO configure component registry after the module is added.
    // self.componentRegistry = new conponentRegistry.ConponentRegistry();
}

/**
 * Starts the server.
 *
 * @param {Server} self the class instance
 * @param {String} configPath the server configuration path
 * @private
 * @memberOf Server#
 */
function start(self) {
    var server = connect()
        .use(connect.cookieParser('let it rain ;)'))
        .use(router({
            session: connect.session({
                key: 'rain.sid',
                secret: 'let it rain ;)',
                store: new MemoryStore(),
                cookie: {
                    path: '/',
                    htpOnly: false
                }
            }),
            query: connect.query(),
            bodyParser: connect.bodyParser()
        })).listen(self.config.server.port);

    console.log("Server started");
}

module.exports = new Server();

"use strict";

// require modules
var connect = require('connect');
var handlebars = require('./handlebars');
var router = require('./router');
//var componentRegistry = require('./component_registry');

// require class modules
var Configuration = require('./configuration');
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
    var configPath = getConfigurationPath();
    this.config = new Configuration(configPath);
    configureServer(this);
    start(this);
}

/**
 * Get the configuration path for the RAIN server.
 *
 * @returns {String} the configuration path
 */
function getConfigurationPath() {
    var configPath;

    process.argv.forEach(function (val, index, array) {
        if (index > 1 && val.indexOf('conf=') == 0) {
            configPath = val.substring(5);
        }
    });

    var defaultConf = process.cwd() + '/conf/server.conf.default';

    return configPath || process.env.RAIN_CONF || defaultConf;
}

/**
 * Configure the server sub-components.
 *
 * @param {Server} self the class instance
 * @private
 * @memberOf Server#
 */
function configureServer(self) {
    handlebars.setup();
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
    var server = connect().use(
            connect.cookieParser('let it rain ;)')
        ).use(router({
            session: connect.session({
                key: 'rain.sid',
                secret: 'let it rain ;)',
                store: new MemoryStore(),
                cookie: {
                    path: '/',
                    htpOnly: false
                }
            })
        })).listen(self.config.server.port);

    console.log("Server started");
}

module.exports = new Server();

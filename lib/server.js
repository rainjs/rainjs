"use strict";

var connect = require('connect');
var configuration = require('./configuration');
var handlebars = require('./handlebars');
//var componentRegistry = require('./component_registry');
var router = require('./router');

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
    this.config = new configuration.Configuration(configPath);
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
    var server = connect()
                    .use(router)
                    .listen(self.config.server.port);

    console.log("Server started");
}

module.exports = new Server();

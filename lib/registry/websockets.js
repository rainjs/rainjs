"use strict";

var path = require('path');
var util = require('../util');
var socketRegistry = require('../socket_registry');

/**
 * Configure the Websocket plugin.
 *
 * @param {Object} componentConf the component configuration
 */
function configure(componentConf) {
    var socketsPath = path.join(componentConf.folder,
                                'server', 'websockets');

    util.walkSync(socketsPath, function (path) {
        var handler = loadModule(path, util.generateContext(componentConf));
        var channel = '/' + componentConf.id + '/'
                          + componentConf.version
                          + ((handler.channel.charAt(0) !== '/') ? '/' : '') + handler.channel;

        socketRegistry.register(channel, handler.handle);
        console.log('Added channel for: ' + channel);
    });
}

module.exports = {
    name: 'Websockets Plugin',
    configure: configure
};

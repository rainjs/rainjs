var util = require('../util');
var path = require('path');

/**
 * Configure the Websocket plugin
 *
 * @param {Object} componentConf the component configuration
 */
function configure(componentConf) {
    var serverConf = require('../configuration');
    var server = require('../server');

    var socketsPath = path.join(serverConf.server.componentPath, componentConf.folder, 'server', 'websockets');

    util.walkDir(socketsPath, function (path, file) {
        var handler = require(path);
        var channel = '/' + componentConf.id + '/'
                          + componentConf.version
                          + ((handler.channel.charAt(0) !== '/') ? '/' : '') + handler.channel;
        server.socket.of(channel).on('connection', handler.handle);
        console.log('Added channel for: ' + channel);
    });
}

module.exports = {
    name: 'Websockets Plugin',
    configure: configure
}

var io = require('socket.io');
var serverConf = require('../configuration');
var util = require('../util');
var path = require('path');

function configure(componentConf) {
    var socketsPath = path.join(serverConf.server.componentPath, componentConf.folder, 'server', 'websockets');

    util.walkDir(socketsPath, function (path, file) {
        var handler = require(path);
        var channel = ((handler.channel.charAt(0) !== '/') ? '/' : '') + handler.channel;

        io.of(channel).on('connection', handler.handle);
        console.log('Added channel for: ' + channel);
    });
}

module.exports = {
    name: 'Websockets Plugin',
    configure: configure
}

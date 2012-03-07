var IntentRegistry = require('../intent_registry');

function IntentHandler () {
    var server = require('../server');

    server.socket.of('/rain_core/intents').on('connection', function (socket) {
        socket.on('request_intent', handle);
    });
}

IntentHandler.prototype.name = 'Intents Plugin';

IntentHandler.prototype.configure = function (componentConf) {
}

module.exports = new IntentHandler();

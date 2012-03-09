var IntentRegistry = require('../intent_registry');

function IntentHandler () {
    var server = require('../server');

    server.socket.of('/rain_core/intents').on('connection', function (socket) {
        socket.on('request_intent', handle);
    });
};

IntentHandler.prototype.name = 'Intents Plugin';

IntentHandler.prototype.configure = function (comp) {
    if (!comp.intents || comp.intents.length === 0) {
        return;
    }

    for (var i = comp.intents.length; i--;) {
        var intent = comp.intents[i];
        IntentRegistry.register(comp, intent);
    }
};

module.exports = new IntentHandler();

var IntentRegistry = {};

function handle(socket) {
    var errMsg;
    var response;

    if(!data.intentCategory) {
        errMsg = "You must specify intent category.";
    }

    if(!data.intentAction) {
        errMsg = "You must specify intent action.";
    }

    if(!data.intentContext) {
        errMsg = "You must specify intent context";
    }

    if(!data.session) {
        errMsg = "You must specify intent session.";
    }

    if(errMsg) {
        socket.emit('intent_exception', {message: errMsg, requestId: data.requestId});

        return;
    }

    socket.get();
}

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

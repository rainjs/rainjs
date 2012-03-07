var socketRegistry = require('./socket_registry');

var intents = {};

function IntentsRegistry () {
    socketRegistry.register('/core', handleIntent);
};

IntentsRegistry.prototype.register = function () {
}

function handleIntent(socket) {
    socket.on('request_intent', function (data) {
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

        /*response = resolveIntent(data.intentCategory, data.intentAction, data.intentContext, data.preferences);

        if (response.length === 0) {
            socket.emit('intent_exception', {message: 'No intent handler found', requestId: data.requestId});

            return;
        }

        if (response.then) {
            // response is a promise => view already processed
            response.then(function(dataRendered) {

            });
        }*/
    });
};

module.exports = new IntentsRegistry();

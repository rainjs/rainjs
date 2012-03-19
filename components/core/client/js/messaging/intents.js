define(['raintime/messaging/sockets', 'raintime/lib/promise'], function (Sockets, Promise) {
    var socket = Sockets.getSocket('/core');

    /**
     * Send an intent and return a promise that gets triggered after the server finishes processing
     * the intent.
     *
     * @param {Object} intent the intent object to be sent to the serve
     *
     * @returns {Promise}
     */
    function sendIntent(intent) {
        var defer = Promise.defer();

        intent.context = intent.context || {};
        intent.context.instanceId = 'modalDialog';

        socket.emit('request_intent', intent, function(error) {
            if (error) {
                defer.reject(error);
                return;
            }

            defer.resolve();
        });

        return defer.promise;
    }

    return {
        send: sendIntent
    };
});


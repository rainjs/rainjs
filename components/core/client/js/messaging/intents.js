define(['core/js/messaging/sockets'], function (Sockets) {
    var socket;

    /**
     * This class handles all aspects of sending intents
     *
     * @constructor
     */
    function IntentHandler() {
        socket = Sockets.getSocket('/core');
    }

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

        return defer.promise;
    }
});

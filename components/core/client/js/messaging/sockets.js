define(["raintime/lib/socket.io"], function (io) {
    var sockets = {};
    var baseUrl = undefined;

    /**
     * Handler class for WebSockets that manages the way WebSocket instances are cached and
     * created.
     *
     * @name SocketHandler
     * @class
     * @constructor
     */
    function SocketHandler() {
        baseUrl = getBaseUrl();

        // Check if we're on Firefox and only have MozWebSocket
        // and assign it to the WebSocket object.
        if(window.MozWebSocket) {
            window.WebSocket = window.MozWebSocket;
        }
    }

    /**
     * Constructs the base url for the socket server out of the window location.
     *
     * @returns {String} the constructed url
     */
    function getBaseUrl() {
        var protocol = window.location.protocol + '//';
        var hostname = window.location.host;

        return protocol + hostname;
    }

    /**
     * Gets the socket associated to a particular channel.
     *
     * @param {String} channel the channel of the socket
     *
     * @returns {Socket} the websocket instance
     */
    SocketHandler.prototype.getSocket = function (channel) {
        if(channel.charAt(0) != "/") {
            channel = "/" + channel;
        }

        return sockets[channel] || (sockets[channel] = io.connect(baseUrl + channel));
    };

    return new SocketHandler();
});

// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

define(["raintime/lib/socket.io"], function (io) {
    var baseUrl = undefined,
        shouldReconnect = undefined;

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
        var protocol = window.location.protocol + '//',
            hostname = window.location.host;

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

        var socket = io.connect(baseUrl + channel, {
            'reconnect': true
        });

        socket.isConnected = socket.isConnected || false;

        socket.on('connect', function () {
            socket.isConnected = true;
        });

        socket.on('reconnect', function () {
            socket.isConnected = true;
        });

        // Ensure that emit calls always operate
        // after the socket is properly connected.
        var _emit = socket.emit;
        socket.emit = function() {
            if (socket.isConnected && !shouldReconnect) {
                _emit.apply(this, arguments);
            } else {
                if(shouldReconnect) {
                    shouldReconnect = false;
                    socket.socket.reconnect();
                }
                var _arguments = Array.prototype.slice.call(arguments);
                socket.on('connect', function() {
                    _emit.apply(this, _arguments);
                });
                socket.on('reconnect', function () {
                    _emit.apply(this, _arguments);
                });
            }
        };

        socket.on('disconnect', function (event) {
            shouldReconnect = true;
        });

        return socket;
    };

    return new SocketHandler();
});

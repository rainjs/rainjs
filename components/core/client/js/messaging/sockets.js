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

'use strict';

define(["raintime/lib/socket.io",
        "raintime/messaging/observer"], function (io, observer) {
    var baseUrl = undefined,
        shouldReconnect = undefined,
        controllerRegexp = /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:controller)\/(.+)/;

    var KEEP_SESSION_ACTIVE_URL = '/core/controller/cookie';

    /**
     * Handler class for WebSockets that manages the way WebSocket instances are cached and
     * created.
     *
     * @name SocketHandler
     * @constructor
     */
    function SocketHandler() {
        var self = this;

        baseUrl = getBaseUrl();

        //rewrite socket emits and save the last time of the emit to keep session cookie updated
        var lastEmit = new Date();
        var oldEmit$ = io.SocketNamespace.prototype.$emit;
        io.SocketNamespace.prototype.$emit = function () {
            lastEmit = Date.now();
            oldEmit$.apply(this, arguments);
        };

        var oldEmit = io.SocketNamespace.prototype.emit;
        io.SocketNamespace.prototype.emit = function () {
            lastEmit = Date.now();
            oldEmit.apply(this, arguments);
        };

        var cookieExpirationLimit = (rainContext.cookieMaxAge || 3600) * 1000;

        //check to see if session cookie needs to be refreshed 1sec before it expires
        var keepSessionActive = setInterval(keepCookieConsistent, cookieExpirationLimit - 1000);

        //keeps the session cookie refreshed is there was any socket or ajax activity
        //othewise publish a session_expired event
        function keepCookieConsistent () {
            var isSocketActive = Date.now() - lastEmit < rainContext.cookieMaxAge;
            var hadAjaxCalls = Date.now() - this._lastAjaxCall < rainContext.cookieMaxAge;

            if (isSocketActive || hadAjaxCalls) {
                $.ajax({url: KEEP_SESSION_ACTIVE_URL});
            } else {
                observer.publish('session_expired');
                clearInterval(keepSessionActive);
            }
        }

        /**
         * The timestamp at which the last AJAX request to a controller route was made.
         *
         * @type {Number}
         * @private
         */
        this._lastAjaxCall = null;

        // wrapping XMLHttpRequest#open to know when the last AJAX request to a controller route
        // was made.
        var oldOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function () {
            var url = arguments[1];

            if (url.match(controllerRegexp)) {
                self._lastAjaxCall = Date.now();
            }

            oldOpen.apply(this, arguments);
        };
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

                var args = Array.prototype.slice.call(arguments);

                socket.once('connect', function () {
                    _emit.apply(this, args);
                });
            }
        };

        socket.on('disconnect', function (event) {
            shouldReconnect = true;
        });

        return socket;
    };

    SocketHandler._instance = null;

    SocketHandler.get = function () {
        if (!SocketHandler._instance) {
            SocketHandler._instance = new SocketHandler();
        }

        return SocketHandler._instance;
    };

    return SocketHandler;
});

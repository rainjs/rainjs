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

define(["raintime/lib/socket.io", "raintime/messaging/observer"], function (io, observer) {

    var REFRESH_COOKIE_URL = '/core/controller/cookie';

    /**
     * Handler class for WebSockets that manages the way WebSocket instances are cached and
     * created.
     *
     * @name SocketHandler
     * @constructor
     */
    function SocketHandler() {
        /**
         * The current protocol and host
         *
         * @type {String}
         * @private
         */
        this._baseUrl = this._getBaseUrl();

        /**
         * Indicates if any communication with the server (WS or AJAX) occurred.
         *
         * @type {Boolean}
         * @private
         */
        this._isClientActive = false;

        /**
         * Indicates that the socket should be reconnected.
         *
         * @type {Boolean}
         * @private
         */
        this._shouldReconnect = false;

        if (rainContext.cookieMaxAge !== 0) {
            this._interceptSocketMessages();
            this._interceptAjaxCalls();
            this._refreshSessionCookie(rainContext.cookieMaxAge);
        }
    }

    /**
     * Gets the socket associated to a particular channel.
     *
     * @param {String} channel the channel of the socket
     *
     * @returns {Socket} the websocket instance
     */
    SocketHandler.prototype.getSocket = function (channel) {
        var self = this;

        if(channel.charAt(0) != "/") {
            channel = "/" + channel;
        }

        var socket = io.connect(this._baseUrl + channel, {
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
            if (socket.isConnected && !self._shouldReconnect) {
                _emit.apply(this, arguments);
            } else {
                if(self._shouldReconnect) {
                    self._shouldReconnect = false;
                    socket.socket.reconnect();
                }

                var args = Array.prototype.slice.call(arguments);

                socket.once('connect', function () {
                    _emit.apply(this, args);
                });
            }
        };

        socket.on('disconnect', function (event) {
            self._shouldReconnect = true;
        });

        return socket;
    };

    /**
     * Constructs the base url for the socket server out of the window location.
     *
     * @returns {String} the constructed url
     */
    SocketHandler.prototype._getBaseUrl = function () {
        var protocol = window.location.protocol + '//',
            hostname = window.location.host;

        return protocol + hostname;
    };

    /**
     * Intercepts all the websocket messages.
     */
    SocketHandler.prototype._interceptSocketMessages = function () {
        var self = this,
            emit = io.SocketNamespace.prototype.emit,
            $emit = io.SocketNamespace.prototype.$emit;

        io.SocketNamespace.prototype.$emit = function () {
            self._isClientActive = true;
            $emit.apply(this, arguments);
        };

        io.SocketNamespace.prototype.emit = function () {
            self._isClientActive = true;
            emit.apply(this, arguments);
        };
    };

    /**
     * Intercepts AJAX calls.
     */
    SocketHandler.prototype._interceptAjaxCalls = function () {
        var self = this,
            controllerRegexp = /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:controller)\/(.+)/;

        var open = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function () {
            var url = arguments[1];

            if (url.match(controllerRegexp)) {
                self._isClientActive = true;
            }

            open.apply(this, arguments);
        };
    };

    /**
     * Refreshes the session cookie when it is about to expire.
     *
     * @param cookieMaxAge
     */
    SocketHandler.prototype._refreshSessionCookie = function (cookieMaxAge) {
        var self = this;

        var intervalId = setInterval(function () {
            if (self._isClientActive) {
                $.ajax({url: REFRESH_COOKIE_URL});
                self._isClientActive = false;
            } else {
                observer.publish('session_expired');
                clearInterval(intervalId);
            }
        }, (cookieMaxAge - 1) * 1000);
    };

    /**
     * The singleton instance.
     *
     * @type {SocketHandler}
     * @private
     */
    SocketHandler._instance = null;

    /**
     * Gets the singleton instance.
     *
     * @returns {SocketHandler}
     */
    SocketHandler.get = function () {
        if (!SocketHandler._instance) {
            SocketHandler._instance = new SocketHandler();
        }

        return SocketHandler._instance;
    };

    return SocketHandler;
});

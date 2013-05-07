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

"use strict";

/**
 * Sockets idle watching and connection monitoring.
 *
 * @name SocketWatch
 * @namespace
 */

var logging = require('./logging'),
    logger = logging.get(),
    io = require('socket.io'),
    util = require('util'),
    config = require('./configuration'),
    monitoring = require('./monitoring').Monitoring.get();


/**
 * Socket idle connections watching and monitoring.
 *
 * @name SocketWatch
 * @namespace
 */
function SocketWatch() {
    this.clientsMap = {},
    this.idleMap = {},
    this.timeoutMap = {},
    this.idleTime = -1;
}

/**
 * The instance of the socketWatch.
 *
 * @type {SocketWatch}
 * @private
 */
SocketWatch._instance = null;

/**
 * Returns the SocketWatch get
 *
 * @name SocketWatch
 * @namespace
 */
SocketWatch.get = function () {
    if (!SocketWatch._instance) {
        SocketWatch._instance = new SocketWatch();
    }

    return SocketWatch._instance;
}


/**
 * Checks socket for idle connections.
 * Also monitors websocket connections and websocket idle connections.
 *
 * @param {Object} the actual socket object.
 */
SocketWatch.prototype.configure = function (socket) {

    this.idleTime = (config.websocket && config.websocket.idleTime) || 1200; // 20 min
    this.idleTime = this.idleTime * 1000;

    var self = this;

    // We need to overwrite $emit to watch all channels.
    // In socket.io $emit is EventEmitter.prototype.emit.
    var $emit = io.Socket.prototype.$emit;
    io.Socket.prototype.$emit = function () {
        var args = Array.prototype.slice.call(arguments);
        self._refreshIdle(this.id, args[0]);
        $emit.apply(this, args);
    };

    var emit = socket.emit;
    socket.emit = function () {
        var args = Array.prototype.slice.call(arguments);
        self._refreshIdle(this.id, args[0]);
        emit.apply(this, args);
    };

    socket.on('connection', function (socket) {
        self.clientsMap[socket.id] = socket;
        var id = monitoring.startMeasurement('websocketConnections');
        // Call checkIdle on 'connection' to use the same socket id.
        self._refreshIdle(socket.id, '');
        socket.on('disconnect', function () {
            self.clientsMap[socket.id] = null;
            monitoring.endMeasurement('websocketConnections', id);
        });
    });
};

/**
 * Checks the current socket id to set a new timeout.
 * When the timeout is reached, the socket is Idle.
 *
 * @param {Object} the actual socket object.
 */
 SocketWatch.prototype._refreshIdle = function (socketId, ev) {
    var id = socketId;

    if (this.timeoutMap[id]) {
        clearTimeout(this.timeoutMap[id]);
        this.timeoutMap[id] = null;

        if (this.idleMap[id]){
            monitoring.endMeasurement('idleWebsocketConnections', id);
            this.idleMap[id] = null;
        }
    }

    var self = this;

    if (ev !== 'connection' && ev !== 'disconnect') {
        this.timeoutMap[id] = setTimeout( function () {
            monitoring.startMeasurement('idleWebsocketConnections', id);
            self.idleMap[id] = true;
        }, this.idleTime);
    }
};

/**
 * Enables idle websockets disconnect.
 * The disconnect is called only after at least "maxIdleWebsockets" sockets are idle.
 *
 * @param {Object} the actual socket object.
 */
SocketWatch.prototype.disconnectOnIdle = function (socket) {

    if (!(config.websocket && config.websocket.disconnectIdle)) {
        return;
    }

    logger.debug('Disconnect websocket idle users after a number of connections reached enabled!');

    var disconnectIdleOnMaxConn = config.websocket.disconnectIdleOnMaxConn || 2000,
        idleCheckTime = (config.websocket.idleCheckInterval || 10) * 1000;
    var self = this;
    setInterval( function() {
        var id;
        if (socket.sockets.clients().length >= disconnectIdleOnMaxConn) {
            for (id in self.idleMap) {
                if (self.idleMap[id] === true) {
                    monitoring.endMeasurement('idleWebsocketConnections', id);
                    self.clientsMap[id].disconnect();
                    delete self.clientsMap[id];
                    delete self.idleMap[id];
                }
            }
        }

    }, idleCheckTime);
};

module.exports = SocketWatch;

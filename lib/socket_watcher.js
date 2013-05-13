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

var logging = require('./logging'),
    logger = logging.get(),
    io = require('socket.io'),
    util = require('util'),
    config = require('./configuration'),
    monitoring = require('./monitoring').Monitoring.get();


/**
 * Socket idle connections watching and monitoring.
 *
 * @name SocketWatcher
 * @constructor
 */
function SocketWatcher() {
    this._clientsMap = {};
    this._idleMap = {};
    this._timeoutMap = {};

    var wsConfig = config.websocket || {};

    this._idleTime = (wsConfig.idleTime || 1200) * 1000;
    this._disconnectIdleOnMaxConn = wsConfig.disconnectIdleOnMaxConn || 2000;
    this._idleCheckTime = (wsConfig.idleCheckInterval || 10) * 1000;
    this._disconnectIdle = wsConfig.disconnectIdle;

}

/**
 * The instance of the SocketWatcher.
 *
 * @type {SocketWatcher}
 * @private
 */
SocketWatcher._instance = null;

/**
 * Returns the SocketWatcher singleton instance.
 *
 * @returns {SocketWatcher}
 */
SocketWatcher.get = function () {
    if (!SocketWatcher._instance) {
        SocketWatcher._instance = new SocketWatcher();
    }

    return SocketWatcher._instance;
}


/**
 * Checks socket for idle connections.
 * Also monitors websocket connections and websocket idle connections.
 *
 * @param {Object} the actual socket object.
 */
SocketWatcher.prototype.configure = function (socketServer) {
    var self = this;

    // We need to overwrite $emit to watch all channels.
    // In socket.io $emit is EventEmitter.prototype.emit.
    var $emit = io.Socket.prototype.$emit;
    io.Socket.prototype.$emit = function () {
        var args = Array.prototype.slice.call(arguments);
        self._refreshIdle(this.id, args[0]);
        $emit.apply(this, args);
    };

    var emit = io.Socket.prototype.emit;
    io.Socket.prototype.emit = function () {
        var args = Array.prototype.slice.call(arguments);
        self._refreshIdle(this.id, args[0]);
        emit.apply(this, args);
    };

    socketServer.on('connection', function (socket) {
        self._clientsMap[socket.id] = socket;
        var id = monitoring.startMeasurement('websocketConnections');

        self._refreshIdle(socket.id, 'connection');
        socket.on('disconnect', function () {
            self._clientsMap[socket.id] = null;
            monitoring.endMeasurement('websocketConnections', id);
        });
    });

    this._disconnectOnIdle(socketServer);
};

/**
 * Checks the current socket id to set a new timeout.
 * When the timeout is reached, the socket is Idle.
 *
 * @param {Object} the actual socket object.
 */
 SocketWatcher.prototype._refreshIdle = function (socketId, ev) {
    if(ev === 'newListener') {
        return;
    }

    var id = socketId;

    if (this._timeoutMap[id]) {
        clearTimeout(this._timeoutMap[id]);
        this._timeoutMap[id] = null;

        if (this._idleMap[id]){
            monitoring.endMeasurement('idleWebsocketConnections', id);
            this._idleMap[id] = null;
        }
    }

    var self = this;

    if (ev !== 'disconnect') {
        this._timeoutMap[id] = setTimeout(function () {
            monitoring.startMeasurement('idleWebsocketConnections', id);
            self._idleMap[id] = true;
        }, this._idleTime);
    }
};

/**
 * Enables idle websockets disconnect.
 * The disconnect is called only after at least "maxIdleWebsockets" sockets are idle.
 *
 * @param {Object} the actual socket object.
 */
SocketWatcher.prototype._disconnectOnIdle = function (socketServer) {

    if (!this._disconnectIdle) {
        return;
    }

    logger.debug('Disconnect websocket idle users after a number of connections reached enabled!');

    var self = this;
    setInterval( function() {
        var id;
        if (socketServer.sockets.clients().length >= self._disconnectIdleOnMaxConn) {
            for (id in self._idleMap) {
                if (self._idleMap[id] === true) {
                    // the disconnect event is emitted synchronously
                    self._clientsMap[id].disconnect();
                    delete self._clientsMap[id];
                    delete self._idleMap[id];
                }
            }
        }
    }, this._idleCheckTime);
}

module.exports = SocketWatcher;

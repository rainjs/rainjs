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

var clientsMap = {},
    idleMap = {},
    timeoutMap = {};

/**
 * Checks socket for idle connections.
 * Also monitors websocket connections and websocket idle connections.
 *
 * @param {Object} the actual socket object.
 */
function configure(socket) {

    var idleTime = (config.server && config.server.idleWebsocket) || 1200; // 20 min
    idleTime = idleTime * 1000;

    var checkIdle = function (ev) {
        var id = this.id;

        if (timeoutMap[id]) {
            clearTimeout(timeoutMap[id]);
            timeoutMap[id] = null;

            if (idleMap[id]){
                monitoring.endMeasurement('idleWebsocketConnections', id);
                idleMap[id] = null;
            }
        }

        if (ev !== 'connection' && ev !== 'disconnect') {
            timeoutMap[id] = setTimeout( function () {
                monitoring.startMeasurement('idleWebsocketConnections', id);
                idleMap[id] = true;
            }, idleTime);
        }
    };

    // We need to overwrite $emit to watch all channels.
    // In socket.io $emit is EventEmitter.prototype.emit.
    var $emit = io.Socket.prototype.$emit;
    io.Socket.prototype.$emit = function () {
        var args = Array.prototype.slice.call(arguments);
        checkIdle.call(this, args[0]);
        $emit.apply(this, args);
    };

    var emit = socket.emit;
    socket.emit = function () {
        var args = Array.prototype.slice.call(arguments);
        checkIdle.call(this, args[0]);
        emit.apply(this, args);
    };

    socket.on('connection', function (socket) {
        clientsMap[socket.id] = socket;
        var id = monitoring.startMeasurement('websocketConnections');
        // Call checkIdle on 'connection' to use the same socket id.
        checkIdle.call(socket, '');

        socket.on('disconnect', function () {
            clientsMap[socket.id] = null;
            monitoring.endMeasurement('websocketConnections', id);
        });
    });
};

/**
 * Enables idle websockets disconnect.
 * The disconnect is called only after at least "maxIdleWebsockets" sockets are idle.
 *
 * @param {Object} the actual socket object.
 */
function disconnectOnIdle(socket) {
    var maxIdleWebsockets = config.server.maxIdleWebsockets,
        idleCheckTime = 10000;

    setInterval( function() {

        var id, count = 0;
        for (id in idleMap) {
            if (idleMap[id] === true) {
                count++;
            }
        }

        if (count >= maxIdleWebsockets) {
            for (id in idleMap) {
                if (idleMap[id] === true) {
                    monitoring.endMeasurement('idleWebsocketConnections', id);
                    clientsMap[id].disconnect();
                    clientsMap[id] = null;
                    idleMap[id] = null;
                }
            }
        }
    }, idleCheckTime);
}

module.exports = {
    configure: configure,
    disconnectOnIdle: disconnectOnIdle
};

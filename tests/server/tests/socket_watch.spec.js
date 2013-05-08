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

var path = require('path');

describe('Socket Watch', function () {
    var mocks, socketWatch, SocketWatch, socket, events, config, checkIdle, Logging;

    beforeEach(function () {


        mocks = {};

        config = {
            "websocket": {
                "idleTime": 5,
                "disconnectIdle": true,
                "disconnectIdleOnMaxConn": 1,
                "idleCheckInterval": 1
            }
        };

        Logging = {
            get: function () {
                return jasmine.createSpyObj('logger',
                                            ['debug', 'info', 'warn', 'error', 'fatal']);
            }
        };

        var Monitoring = {
            Monitoring: jasmine.createSpyObj('Monitoring', ['get'])
        };
        var monitoring = jasmine.createSpyObj('monitoring',
            ['startMeasurement', 'endMeasurement', 'registerEvent']);
        Monitoring.Monitoring.get.andReturn(monitoring);

        socket = jasmine.createSpy('socket', ['on','emit']);
        socket = {
            id: 'test_id',
            on: jasmine.createSpy('on'),
            emit: jasmine.createSpy('emit')
        };

        mocks['./monitoring'] = Monitoring;
        mocks['./configuration'] = config;
        mocks['./logging'] = Logging;
        SocketWatch = loadModuleExports(path.join('lib', 'socket_watch.js'), mocks);
    });

    describe('get', function () {
        it('should always return the same instance', function () {
            expect(SocketWatch._instance).toBeNull();

            socketWatch = SocketWatch.get();

            expect(SocketWatch._instance).toBeDefined();
            expect(socketWatch instanceof SocketWatch).toEqual(true);
        });
    });

    describe('Configure socketWatch', function () {

        beforeEach(function () {
            socketWatch = SocketWatch.get();
            socketWatch._refreshIdle = jasmine.createSpy('_refreshIdle');
        });

        it('Should use deafult if idleTime is not defined in config', function () {
            config.websocket.idleTime = null;

            socketWatch.configure(socket);
            expect(socketWatch.idleTime).not.toBe(-1);
            expect(socketWatch.idleTime).not.toBeNull();
        });

        it('Should config idleTime', function () {
            config.websocket.idleTime = 1;
            socketWatch.configure(socket);

            expect(socketWatch.idleTime).toBe(1000);
        });

        it('Should call _refreshIdle on emit', function () {
            socketWatch.configure(socket);
            socket.emit('foo');

            expect(socketWatch._refreshIdle).toHaveBeenCalled();
            expect(socketWatch._refreshIdle).toHaveBeenCalledWith('test_id', 'foo');
        });

        it('Should correctly call \'on\' on connect emit', function () {
            socketWatch.configure(socket);
            socket.emit('connect');

            expect(socket.on).toHaveBeenCalled();
        });
    });


    describe('Refresh idle status of socket', function () {
        beforeEach(function () {
            socketWatch = SocketWatch.get();
         });

        it('Should set a new timeout if not defined', function () {
            socketWatch.timeoutMap['test_id'] = null;
            socketWatch._refreshIdle('test_id', '');

            expect(socketWatch.timeoutMap['test_id']).not.toBeNull();
        });

        it('Should not set a new timeout on connection', function () {
            socketWatch.timeoutMap['test_id'] = null;
            socketWatch._refreshIdle('test_id', 'connection');

            expect(socketWatch.timeoutMap['test_id']).toBeNull();
        });

        it('Should not set a new timeout on disconnect', function () {
            socketWatch.timeoutMap['test_id'] = null;
            socketWatch._refreshIdle('test_id', 'disconnect');

            expect(socketWatch.timeoutMap['test_id']).toBeNull();
        });

        it('Should null out idleMap id if idle true', function () {
            socketWatch.idleMap['test_id'] = true;
            socketWatch._refreshIdle('test_id', '');

            expect(socketWatch.idleMap['test_id']).not.toBeNull();
        });
    });


    describe('Disconnect on Idle', function () {
        var oldSetTimeout, timeWaited;
        beforeEach(function () {
            socket.sockets = {
                clients: function() {
                    return [1];
                }
            };

            oldSetTimeout = setTimeout;
            timeWaited = 0;

            SocketWatch = loadModuleExports(path.join('lib', 'socket_watch.js'), mocks, {
                setInterval: function(callback, timeout) {
                    timeWaited += timeout;
                    callback();
                }
            });

            socketWatch = SocketWatch.get();
         });

        it('Should call setInterval on correct time', function () {
            socketWatch.disconnectOnIdle(socket);
            expect(timeWaited).toBe(1000);
        });

        it('Should disconnect user on idle', function () {
            socketWatch.idleMap['test_id'] = true;
            socketWatch.clientsMap['test_id'] = {
                disconnect: function() {}
            }
            socketWatch.disconnectOnIdle(socket);

            expect(socketWatch.clientsMap['test_id']).not.toBeDefined();
            expect(socketWatch.idleMap['test_id']).not.toBeDefined();
        });

        it('Should not disconnect user if not idle', function () {
            socketWatch.idleMap['test_id'] = false;
            socketWatch.clientsMap['test_id'] = {
                disconnect: function() {}
            }
            socketWatch.disconnectOnIdle(socket);

            expect(socketWatch.clientsMap['test_id']).toBeDefined();
            expect(socketWatch.idleMap['test_id']).toBeDefined();
        });
    });
});

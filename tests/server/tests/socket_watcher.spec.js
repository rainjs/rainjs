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
    var mocks, socketWatcher, SocketWatcher, socket, events, config, checkIdle, Logging;

    beforeEach(function () {


        mocks = {};

        config = {
            "websocket": {
                "idleTime": 0.1,
                "disconnectIdle": false,
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
            ['startMeasurement', 'endMeasurement', 'registerEvent', 'registerTld']);
        Monitoring.Monitoring.get.andReturn(monitoring);

        socket = jasmine.createSpy('socket', ['on','emit']);
        socket = {
            id: 'test_id',
            on: jasmine.createSpy('on'),
            emit: jasmine.createSpy('emit'),
            handshake: {
                headers: {
                    host: 'fake.schlund.net'
                }
            }
        };

        mocks['./monitoring'] = Monitoring;
        mocks['./configuration'] = config;
        mocks['./logging'] = Logging;
        SocketWatcher = loadModuleExports(path.join('lib', 'socket_watcher.js'), mocks);
    });

    describe('get', function () {
        it('should always return the same instance', function () {
            expect(SocketWatcher._instance).toBeNull();

            socketWatcher = SocketWatcher.get();

            expect(SocketWatcher._instance).toBeDefined();
            expect(socketWatcher instanceof SocketWatcher).toEqual(true);
        });
        it('Should config idleTime', function () {

            socketWatcher = SocketWatcher.get();

            socketWatcher.configure(socket);

            expect(socketWatcher._idleTime).toBe(100);
        });
    });

    describe('Configure socketWatcher', function () {

        beforeEach(function () {
            socketWatcher = SocketWatcher.get();
            socketWatcher._refreshIdle = jasmine.createSpy('_refreshIdle');
        });

        it('Should use deafult if idleTime is not defined in config', function () {
            config.websocket.idleTime = null;

            socketWatcher.configure(socket);
            socketWatcher._clientsMap['test_id'] = socket;
            expect(socketWatcher._idleTime).not.toBe(-1);
            expect(socketWatcher._idleTime).not.toBeNull();
        });


        it('Should correctly call \'on\' on connect emit', function () {
            socketWatcher.configure(socket);
            socketWatcher._clientsMap['test_id'] = socket;
            socket.emit('connect');

            expect(socket.on).toHaveBeenCalled();
        });
    });


    describe('Refresh idle status of socket', function () {
        beforeEach(function () {
            socketWatcher = SocketWatcher.get();
            socketWatcher.configure(socket);
         });

        it('Should set a new timeout if not defined', function () {
            socketWatcher._clientsMap['test_id'] = socket;
            socketWatcher._refreshIdle('test_id', '');

            expect(socketWatcher._timeoutMap['test_id']).not.toBeNull();
        });

        it('Should not set a new timeout on disconnect', function () {
            socketWatcher._timeoutMap['test_id'] = null;
            socketWatcher._clientsMap['test_id'] = socket;
            socketWatcher._refreshIdle('test_id', 'disconnect');

            expect(socketWatcher._timeoutMap['test_id']).toBeNull();
        });

        it('Should null out idleMap id if idle true', function () {
            socketWatcher._clientsMap['test_id'] = socket;
            socketWatcher._idleMap['test_id'] = true;
            socketWatcher._refreshIdle('test_id', '');

            expect(socketWatcher._idleMap['test_id']).not.toBeNull();
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
            config.websocket.disconnectIdle = true;
            oldSetTimeout = setTimeout;
            timeWaited = 0;

            SocketWatcher = loadModuleExports(path.join('lib', 'socket_watcher.js'), mocks, {
                setInterval: function(callback, timeout) {
                    timeWaited += timeout;
                    callback();
                }
            });

            socketWatcher = SocketWatcher.get();
            socketWatcher.configure(socket);
         });

        it('Should call setInterval on correct time', function () {
            socketWatcher._clientsMap['test_id'] = socket;
            socketWatcher._disconnectOnIdle(socket);
            expect(timeWaited).toBe(2000);
        });

        it('Should disconnect user on idle', function () {
            socketWatcher._clientsMap['test_id'] = {
                disconnect: function() {},
                handshake: {
                    headers: {
                        host: 'fake.schlund.net'
                    }
                }
            }
            socketWatcher._idleMap['test_id'] = true;
            socketWatcher._disconnectOnIdle(socket);

            expect(socketWatcher._clientsMap['test_id']).not.toBeDefined();
            expect(socketWatcher._idleMap['test_id']).not.toBeDefined();
        });

        it('Should not disconnect user if not idle', function () {
            socketWatcher._clientsMap['test_id'] = {
                disconnect: function() {},
                handshake: {
                    headers: {
                        host: 'fake.schlund.net'
                    }
                }
            }
            socketWatcher._idleMap['test_id'] = false;
            socketWatcher._disconnectOnIdle(socket);

            expect(socketWatcher._clientsMap['test_id']).toBeDefined();
            expect(socketWatcher._idleMap['test_id']).toBeDefined();
        });
    });
});

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

describe('Client-side logger', function () {
    describe('constructor', function () {
        it('should create the core logger',
            ['raintime/logger', 'raintime/messaging/sockets'], function (Logger, SocketHandler) {
                SocketHandler.get().getSocket.andReturn({on: jasmine.createSpy()});
                new Logger();
                expect(SocketHandler.get().getSocket).toHaveBeenCalledWith('/core/logging');
            }
        );

        it('should create a comoonent logger',
            ['raintime/logger', 'raintime/messaging/sockets'], function (Logger, SocketHandler) {
                SocketHandler.get().getSocket.andReturn({on: jasmine.createSpy()});
                new Logger({id: 'example', version: '1.0'});
                expect(SocketHandler.get().getSocket).toHaveBeenCalledWith('/example/1.0/logging');
            }
        );
    });

    describe('_log', function () {
        it('should emit a log event using websockets',
            ['raintime/logger', 'raintime/messaging/sockets'], function (Logger, SocketHandler) {
                var socket = {
                    emit: jasmine.createSpy('emit'),
                    on: jasmine.createSpy('on')
                };
                SocketHandler.get().getSocket.andReturn(socket);

                socket.on.andCallFake(function (event, cb) {
                    cb();
                });

                var logger = new Logger();
                logger._log.andCallThrough();

                logger._log('debug', 'message', 'error');

                var event = {
                    level: 'debug',
                    message: 'message',
                    error: 'error'
                };
                expect(socket.emit).toHaveBeenCalledWith('log', event);
            }
        );

        it('should queue the messages until the socket is ready',
                ['raintime/logger', 'raintime/messaging/sockets'], function (Logger, SocketHandler) {
                    var socket = {
                        emit: jasmine.createSpy('emit'),
                        on: jasmine.createSpy('on')
                    };
                    SocketHandler.get().getSocket.andReturn(socket);

                    var f;
                    socket.on.andCallFake(function (event, cb) {
                        f = cb;
                    });

                    var logger = new Logger();
                    logger._log.andCallThrough();

                    logger._log('info', 'message1', 'error1');
                    logger._log('warn', 'message2', 'error2');

                    expect(socket.emit).not.toHaveBeenCalled();

                    f && f();

                    logger._log('debug', 'message3', 'error3');

                    expect(socket.emit).toHaveBeenCalledWith('log',
                        {level: 'info', message: 'message1', error: 'error1'});
                    expect(socket.emit).toHaveBeenCalledWith('log',
                        {level: 'warn', message: 'message2', error: 'error2'});
                    expect(socket.emit).toHaveBeenCalledWith('log',
                        {level: 'debug', message: 'message3', error: 'error3'});
                }
        );
    });

    describe('debug', function () {
        it('should call _log with debug level',
            ['raintime/logger', 'raintime/messaging/sockets'], function (Logger, SocketHandler) {
                SocketHandler.get().getSocket.andReturn({on: jasmine.createSpy()});
                var logger = new Logger();
                logger.debug.andCallThrough();
                logger.debug('message', 'error');

                expect(logger._log).toHaveBeenCalledWith('debug', 'message', 'error');
            }
        );
    });

    describe('info', function () {
        it('should call _log with info level',
            ['raintime/logger', 'raintime/messaging/sockets'], function (Logger, SocketHandler) {
                SocketHandler.get().getSocket.andReturn({on: jasmine.createSpy()});
                var logger = new Logger();
                logger.info.andCallThrough();
                logger.info('message', 'error');

                expect(logger._log).toHaveBeenCalledWith('info', 'message', 'error');
            }
        );
    });

    describe('warn', function () {
        it('should call _log with warn level',
            ['raintime/logger', 'raintime/messaging/sockets'], function (Logger, SocketHandler) {
                SocketHandler.get().getSocket.andReturn({on: jasmine.createSpy()});
                var logger = new Logger();
                logger.warn.andCallThrough();
                logger.warn('message', 'error');

                expect(logger._log).toHaveBeenCalledWith('warn', 'message', 'error');
            }
        );
    });

    describe('error', function () {
        it('should call _log with error level',
            ['raintime/logger', 'raintime/messaging/sockets'], function (Logger, SocketHandler) {
                SocketHandler.get().getSocket.andReturn({on: jasmine.createSpy()});
                var logger = new Logger();
                logger.error.andCallThrough();
                logger.error('message', 'error');

                expect(logger._log).toHaveBeenCalledWith('error', 'message', 'error');
            }
        );
    });

    describe('fatal', function () {
        it('should call _log with fatal level',
            ['raintime/logger', 'raintime/messaging/sockets'], function (Logger, SocketHandler) {
                SocketHandler.get().getSocket.andReturn({on: jasmine.createSpy()});
                var logger = new Logger();
                logger.fatal.andCallThrough();
                logger.fatal('message', 'error');

                expect(logger._log).toHaveBeenCalledWith('fatal', 'message', 'error');
            }
        );
    });

    describe('get', function () {
        it('should get the platform logger',
            ['raintime/logger', 'raintime/messaging/sockets'], function (Logger, SocketHandler) {
                SocketHandler.get().getSocket.andReturn({on: jasmine.createSpy()});
                Logger.get.andCallThrough();
                var logger = Logger.get();
                expect(logger._component).toBeUndefined();
            }
        );

        it('should cache the logger instances',
            ['raintime/logger', 'raintime/messaging/sockets'], function (Logger, SocketHandler) {
                SocketHandler.get().getSocket.andReturn({on: jasmine.createSpy()});
                Logger.get.andCallThrough();
                var instance1 = Logger.get(),
                    instance2 = Logger.get();

                expect(instance1).toBe(instance2);
            }
        );

        it('should get a component logger',
            ['raintime/logger', 'raintime/messaging/sockets'], function (Logger, SocketHandler) {
                SocketHandler.get().getSocket.andReturn({on: jasmine.createSpy()});
                Logger.get.andCallThrough();
                var logger = Logger.get({id: 'example', version: '1.0'});
                expect(logger._component).toEqual({id: 'example', version: '1.0'});
            }
        );
    });
});

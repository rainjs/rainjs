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

var path = require('path'),
    moment = require('moment');

describe('File appender', function () {
    var mocks, Spy,
        FileAppenderModule, FileAppender,
        appender, layout, options;

    beforeEach(function () {
        Spy = jasmine.createSpyObj('Spy', ['Appender']);

        Spy.Stream = jasmine.createSpyObj('Spy.Stream', ['write', 'end', 'on', 'end']);
        Spy.Stream.writable = true;

        Spy.fs = jasmine.createSpyObj('Spy.fs', ['createWriteStream', 'openSync', 'renameSync']);
        Spy.fs.createWriteStream.andReturn(Spy.Stream);

        mocks = {};
        mocks['../appender'] = Spy.Appender;
        mocks['fs'] = Spy.fs;

        // NEWLINE is needed from the module's context
        FileAppenderModule = loadModuleContext(
                path.join('lib', 'logging', 'appenders', 'file.js'), mocks);
        FileAppender = FileAppenderModule.module.exports;

        layout = {};
    });

    describe('constructor', function () {

        it('should throw an exception if options are missing', function () {
            function instantiate() {
                new FileAppender('info', layout);
            }

            expect(instantiate).toThrowType(RainError.ERROR_PRECONDITION_FAILED);
        });

        it('should throw an exception if file option is missing', function () {
            function instantiate() {
                new FileAppender('info', layout, {});
            }

            expect(instantiate).toThrowType(RainError.ERROR_PRECONDITION_FAILED);
        });

        it('should call the parent constructor', function () {
            options = {
                file: 'log.log'
            };
            appender = new FileAppender('info', layout, options);

            expect(Spy.Appender).toHaveBeenCalledWith('info', layout);
        });

        it('should create a write stream with default params', function () {
            options = {
                file: 'log.log'
            };
            appender = new FileAppender('info', layout, options);

            expect(Spy.fs.createWriteStream).toHaveBeenCalledWith(
                    options.file,
                    {
                        flags: 'a',
                        encoding: 'utf-8',
                        mode: '0644'
                    });

            expect(Spy.Stream.on.mostRecentCall.args[0]).toEqual('error');
            expect(Spy.Stream.on.mostRecentCall.args[1]).toEqual(jasmine.any(Function));
        });

        it('should create a write stream with custom params', function () {
            options = {
                file: 'log.log',
                encoding: 'ascii',
                mode: '0622'
            };
            appender = new FileAppender('info', layout, options);

            expect(Spy.fs.createWriteStream).toHaveBeenCalledWith(
                    options.file,
                    {
                        flags: 'a',
                        encoding: options.encoding,
                        mode: options.mode
                    });

            expect(Spy.Stream.on.mostRecentCall.args[0]).toEqual('error');
            expect(Spy.Stream.on.mostRecentCall.args[1]).toEqual(jasmine.any(Function));
        });
    });

    describe('write', function () {

        it('should write the log message to the stream', function () {
            var message = 'message',
                options = {
                    file: 'log.log'
                };

            appender = new FileAppender('info', layout, options);
            appender._write(message);

            expect(Spy.Stream.write)
                .toHaveBeenCalledWith(message + FileAppenderModule.NEWLINE);
        });
    });

    describe('destroy', function () {

        it('should end the write stream', function () {
            options = {
                file: 'log.log'
            };
            appender = new FileAppender('info', layout, options);
            appender.destroy();

            expect(Spy.Stream.end).toHaveBeenCalled();
        });
    });

    describe('logRotate', function () {
        it('should rotate the log', function () {
            options = {
                file: 'log.log',
                rotateFile: {
                    path: "logrotate.log",
                    format: "DD-MM-YYYY HH:mm"
                }
            };
            appender = new FileAppender('info', layout, options);
            appender.rotate();

            expect(Spy.Stream.end).toHaveBeenCalled();
            expect(Spy.fs.renameSync).toHaveBeenCalledWith(options.file,
                    path.resolve(options.rotateFile.path) + '.' + moment().format(options.rotateFile.format));
            expect(Spy.fs.openSync.argsForCall.length).toBe(2);
            expect(Spy.fs.createWriteStream).toHaveBeenCalled();
        });

        it('should rotate the log if rotateFile.path is missing default options.file', function () {
            options = {
                file: 'log.log',
                rotateFile: {
                    format: "DD-MM-YYYY HH:mm"
                }
            };
            appender = new FileAppender('info', layout, options);
            appender.rotate();

            expect(Spy.Stream.end).toHaveBeenCalled();
            expect(Spy.fs.renameSync).toHaveBeenCalledWith(options.file,
                    path.resolve(options.file) + '.' + moment().format(options.rotateFile.format));
            expect(Spy.fs.createWriteStream).toHaveBeenCalled();
            expect(Spy.fs.openSync.argsForCall.length).toBe(2);
            expect(Spy.fs.createWriteStream.argsForCall.length).toBe(2);
        });

        it('should rotate the log if rotateFile.format key is missing default format', function () {
            options = {
                file: 'log.log',
                rotateFile: {
                    path: "log.log"
                }
            };

            var defaultFormat = "DD-MM-YYYY HH:mm";
            appender = new FileAppender('info', layout, options);
            appender.rotate();

            expect(Spy.Stream.end).toHaveBeenCalled();
            expect(Spy.fs.renameSync).toHaveBeenCalledWith(options.file,
                    path.resolve(options.rotateFile.path) + '.' + moment().format(defaultFormat));
            expect(Spy.fs.createWriteStream).toHaveBeenCalled();
            expect(Spy.fs.openSync.argsForCall.length).toBe(2);
            expect(Spy.fs.createWriteStream.argsForCall.length).toBe(2);
        });

        it('should rotate the log and set the day depending on the parameter in options', function () {
            options = {
                    file: 'log.log',
                    rotateFile: {
                        path: "log.log",
                        format: "DD-MM-YY HH:mm",
                        days: -1
                    }
            };
            appender = new FileAppender('info', layout, options);
            appender.rotate();

            expect(Spy.Stream.end).toHaveBeenCalled();
            expect(Spy.fs.renameSync).toHaveBeenCalledWith(options.file,
                    path.resolve(options.rotateFile.path) + '.' + 
                    moment().add('days', options.rotateFile.days)
                    .format(options.rotateFile.format));
            expect(Spy.fs.createWriteStream).toHaveBeenCalled();
            expect(Spy.fs.openSync.argsForCall.length).toBe(2);
            expect(Spy.fs.createWriteStream.argsForCall.length).toBe(2);
        });
    });
});

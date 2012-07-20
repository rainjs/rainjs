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

describe('Logger', function () {
    var Logger, logger, error, Event, appender1, appender2, event, config, util,
        ConsoleAppender, FileAppender;

    beforeEach(function () {
        // simulates the exports of an Appender module
        ConsoleAppender = jasmine.createSpy('ConsoleAppender');
        FileAppender = jasmine.createSpy('FileAppender');

        var mocks = {};
        Event = mocks['./event'] = jasmine.createSpy('Event');
        event = {message: 'some event'};
        Event.andReturn(event);
        config = mocks['../configuration'] = {
            logger: {
                level: 'info',
                appenders: [{
                    type: 'console',
                    layout: {
                        type: 'pattern',
                        params: {
                            pattern: '[%level] %date: %message'
                        }
                    }
                },
                {
                    level: 'debug',
                    type: 'file',
                    layout: {
                        type: 'pattern',
                        params: {
                            pattern: '[%level] %date: %message'
                        }
                    },
                    params: {
                        file: 'logs/error.log'
                    }
                }]
            }
        };
        util = mocks['../util'] = jasmine.createSpyObj('util', ['walkSync']);
        mocks[path.join('/rain/lib/logging', 'appenders', 'console.js')] = ConsoleAppender;
        mocks[path.join('/rain/lib/logging', 'appenders', 'file.js')] = FileAppender;

        appender1 = jasmine.createSpyObj('appender1', ['append', 'destroy']);
        appender2 = jasmine.createSpyObj('appender2', ['append', 'destroy']);

        Logger = loadModuleExports('/lib/logging/logger.js', mocks,
                                   {__dirname: '/rain/lib/logging'});
        logger = new Logger([appender1, appender2]);
        createSpies();

        error = new RainError('some error');
    });

    function createSpies() {
        spyOn(logger, 'debug');
        spyOn(logger, 'info');
        spyOn(logger, 'warn');
        spyOn(logger, 'error');
        spyOn(logger, 'fatal');
        spyOn(logger, '_log');
        spyOn(logger, 'destroy');

        spyOn(Logger, 'get');
        spyOn(Logger, '_registerModules');
        spyOn(Logger, '_createAppender');
        spyOn(Logger, '_createLayout');
    }

    describe('_log', function () {
        it('should call _log with the correct level', function () {
            var levels = ['debug', 'info', 'warn', 'error', 'fatal'];
            for (var i = 0, len = levels.length; i < len; i++) {
                logger[levels[i]].andCallThrough();
                logger[levels[i]]('message', error);
                expect(logger._log).toHaveBeenCalledWith(levels[i], 'message', error);
            }
        });

        it ('should call append for all appenders', function () {
            logger._log.andCallThrough();

            logger._log('debug', 'some message', error);

            expect(Event).toHaveBeenCalledWith('debug', 'some message', error);
            expect(appender1.append).toHaveBeenCalledWith(event);
            expect(appender2.append).toHaveBeenCalledWith(event);
        });
    });

    describe('destroy', function () {
        it('should call destroy for all appenders', function () {
            logger.destroy.andCallThrough();

            logger.destroy();

            expect(appender1.destroy).toHaveBeenCalled();
            expect(appender2.destroy).toHaveBeenCalled();
        });
    });

    describe('get', function () {
        beforeEach(function () {
            Logger.get.andCallThrough();
        });

        it('should create a new instance', function () {
            var newLogger = Logger.get();

            expect(newLogger instanceof Logger).toBe(true);
            expect(Logger._registerModules).toHaveBeenCalledWith('appenders', jasmine.any(Object));
            expect(Logger._registerModules).toHaveBeenCalledWith('layouts', jasmine.any(Object));
            expect(Logger._createAppender).toHaveBeenCalledWith(config.logger.appenders[0]);
            expect(Logger._createAppender).toHaveBeenCalledWith(config.logger.appenders[1]);
            expect(newLogger._appenders.length).toEqual(2);
        });

        it('should return the existing instance', function () {
            var logger1 = Logger.get();
            var logger2 = Logger.get();

            expect(logger1).toBe(logger2);
        });

        it('should throw if the logger level is invalid or missing', function () {
            delete config.logger.level;

            expect(function () { Logger.get(); }).toThrow();

            config.logger.level = 'invalid';

            expect(function () { Logger.get(); }).toThrow();
        });
    });

    describe('_registerModules', function () {
        it('should register the modules from a given folder', function () {
            Logger._registerModules.andCallThrough();
            util.walkSync.andCallFake(function (folder, extensions, callback) {
                callback(path.join(folder, 'console.js'));
                callback(path.join(folder, 'file.js'));
            });
            var obj = {};

            Logger._registerModules('appenders', obj);

            expect(util.walkSync).toHaveBeenCalledWith(path.join('/rain/lib/logging', 'appenders'),
                ['.js'], jasmine.any(Function));
            expect(obj['console']).toBe(ConsoleAppender);
            expect(obj['file']).toBe(FileAppender);
        });
    });

    describe('_createAppender', function () {
        var createAppender;

        beforeEach(function () {
            Logger._createAppender.andCallThrough();
            Logger._appenderConstructors = {
                'console': ConsoleAppender,
                'file': FileAppender
            };

            ConsoleAppender.andReturn(appender1);
            FileAppender.andReturn(appender2);

            createAppender = function () {
                Logger._createAppender(config.logger.appenders[0]);
            };
        });

        it('should create an appender', function () {
            var appender = Logger._createAppender(config.logger.appenders[1]);

            expect(appender).toBe(appender2);
            expect(Logger._createLayout).toHaveBeenCalledWith(config.logger.appenders[1].layout);
        });

        it('should throw if appender level is invalid', function () {
            config.logger.appenders[0].level = 'invalid';

            expect(createAppender).toThrow();
        });

        it('should throw an error if appender type is invalid', function () {
            config.logger.appenders[0].type = 'invalid';

            expect(createAppender).toThrow();
        });

        it('should throw an error if layout options are empty', function () {
            delete config.logger.appenders[0].layout;

            expect(createAppender).toThrow();
        });
    });

    describe('_createLayout', function () {
        var PatternLayout, layout;

        beforeEach(function () {
            Logger._createLayout.andCallThrough();

            layout = jasmine.createSpyObj('layout', ['format']);
            PatternLayout = jasmine.createSpy('PatternLayout');
            PatternLayout.andReturn(layout);

            Logger._layoutConstructors = {
                'pattern': PatternLayout
            };
        });

        it('should create a layout', function () {
            expect(Logger._createLayout(config.logger.appenders[1].layout)).toBe(layout);
        });

        it('should throw if layout type is invalid', function () {
            config.logger.appenders[0].layout.type = 'invalid';

            var createLayout = function () {
                Logger._createLayout(config.logger.appenders[0].layout);
            };

            expect(createLayout).toThrow();
        });
    });
});

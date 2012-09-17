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

describe('Configurator', function () {
    var Configurator, configurator, appender1, appender2, layout1, config, util,
        ConsoleAppender, FileAppender, ConsoleColorsAppender, PatternLayout, AllLayout,
        component, componentConfig, logger;

    beforeEach(function () {
        component = {
            id: 'example',
            version: '1.0',
            paths: function (folder) {
                return folder;
            }
        };

        logger = jasmine.createSpyObj('logger', ['debug', 'info', 'warn', 'error', 'fatal']);

        ConsoleAppender = jasmine.createSpy('ConsoleAppender');
        FileAppender = jasmine.createSpy('FileAppender');
        ConsoleColorsAppender = function () {
            throw new Error('custom error');
        };

        PatternLayout = jasmine.createSpy('PatternLayout');
        AllLayout = function () {
            throw new Error('custom error');
        };

        var mocks = {};
        mocks['../configuration'] = config = {
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
        mocks['../util'] = util = jasmine.createSpyObj('util', ['walkSync']);

        mocks[path.join('/rain/lib/logging', 'appenders', 'console.js')] = ConsoleAppender;
        mocks[path.join('/rain/lib/logging', 'appenders', 'file.js')] = FileAppender;
        mocks[path.join('/rain/lib/logging', 'appenders',
                        'console_colors.js')] = ConsoleColorsAppender;
        mocks['server/custom_appender'] = function () {};
        mocks['server/custom_appender_with_error'] = function () {
            throw new Error('custom error');
        };

        mocks[path.join('/rain/lib/logging', 'layouts', 'pattern.js')] = PatternLayout;
        mocks[path.join('/rain/lib/logging', 'layouts', 'all.js')] = AllLayout;
        mocks['server/all'] = function () {};
        mocks['server/all_with_error'] = function () {
            throw new Error('custom error');
        };

        mocks['./logger'] = {
            get: function () {
                return logger;
            }
        };
        mocks['../component_registry'] = {
            getConfig: function () {
                return componentConfig;
            }
        };

        appender1 = jasmine.createSpyObj('appender1', ['append', 'destroy']);
        appender2 = jasmine.createSpyObj('appender2', ['append', 'destroy']);
        layout1 = jasmine.createSpyObj('layout1', ['format']);

        Configurator = loadModuleExports('/lib/logging/configurator.js', mocks,
                                   {__dirname: '/rain/lib/logging'});
        createSpies();
    });

    function createSpies() {
        spyOn(Configurator.prototype, '_registerModules');
        spyOn(Configurator.prototype, '_createAppender');
        spyOn(Configurator.prototype, '_createLayout');
    }

    describe('get configurator', function () {

        it('should create a new instance', function () {
            var newConfigurator = Configurator.get();

            expect(newConfigurator instanceof Configurator).toBe(true);
            expect(Configurator.prototype._registerModules)
                    .toHaveBeenCalledWith('appenders', jasmine.any(Object));
            expect(Configurator.prototype._registerModules)
                    .toHaveBeenCalledWith('layouts', jasmine.any(Object));
        });

        it('should return the existing instance', function () {
            var configurator1 = Configurator.get();
            var configurator2 = Configurator.get();

            expect(configurator1).toBe(configurator2);
        });
    });

    describe('_registerModules', function () {

        it('should register the modules from a given folder', function () {
            Configurator.prototype._registerModules.andCallThrough();
            util.walkSync.andCallFake(function (folder, extensions, callback) {
                callback(path.join(folder, 'console.js'));
                callback(path.join(folder, 'file.js'));
            });
            var obj = {};

            Configurator.prototype._registerModules('appenders', obj);

            expect(util.walkSync).toHaveBeenCalledWith(path.join('/rain/lib/logging', 'appenders'),
                                                       ['.js'], jasmine.any(Function));
            expect(obj['console']).toBe(ConsoleAppender);
            expect(obj['file']).toBe(FileAppender);
        });
    });

    describe('_createAppender', function () {
        var createAppender;

        beforeEach(function () {
            configurator = Configurator.get();
            configurator._createAppender.andCallThrough();

            configurator._appenderConstructors = {
                'console': ConsoleAppender,
                'file': FileAppender,
                'console_colors': ConsoleColorsAppender
            };

            ConsoleAppender.andReturn(appender1);
            FileAppender.andReturn(appender2);

            createAppender = function () {
                configurator._createAppender(config.logger.appenders[0]);
            };
        });

        it('should throw an error if level is invalid', function () {
            config.logger.appenders[0].level = 'invalid';

            expect(createAppender).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'level');
        });

        it('should log with error level if the custom appender is missing', function () {
            config.logger.appenders[0].type = Configurator.CUSTOM_TYPE;
            config.logger.appenders[0].file = 'invalid_custom_appender';

            var appender = configurator._createAppender(config.logger.appenders[0], component);
            expect(appender).toBeUndefined();
            expect(logger.error).toHaveBeenCalled();
        });

        it('should throw an error if the appender and the component are invalid', function () {
            config.logger.appenders[0].type = 'invalid type';

            expect(createAppender).toThrowType(RainError.ERROR_PRECONDITION_FAILED,
                                               'component config');
        });

        it('should log with error level if the appender type is invalid', function () {
            config.logger.appenders[0].type = 'invalid type';

            var appender = configurator._createAppender(config.logger.appenders[0], component);
            expect(appender).toBeUndefined();
            expect(logger.error).toHaveBeenCalled();
        });

        it('should throw an error if the layout and the component are invalid', function () {
            config.logger.appenders[0].layout = undefined;

            expect(createAppender).toThrowType(RainError.ERROR_PRECONDITION_FAILED,
                                               'layout');
        });

        it('should log with error level if the layout is invalid', function () {
            config.logger.appenders[0].layout = undefined;

            var appender = configurator._createAppender(config.logger.appenders[0], component);
            expect(appender).toBeUndefined();
            expect(logger.error).toHaveBeenCalled();
        });

        it('should return undefined if the layout cannot be created', function () {
            configurator._createLayout = function () {
                return undefined;
            };

            var appender = configurator._createAppender(config.logger.appenders[0], component);
            expect(appender).toBeUndefined();
            expect(logger.error).not.toHaveBeenCalled();
        });

        it('should create a global appender', function () {
            configurator._createLayout.andCallFake(function () {
                return {};
            });
            var appender = configurator._createAppender(config.logger.appenders[1]);

            expect(appender).toBe(appender2);
            expect(configurator._createLayout)
                    .toHaveBeenCalledWith(config.logger.appenders[1].layout, undefined);
        });

        it('should create a component appender', function () {
            config.logger.appenders[0].type = Configurator.CUSTOM_TYPE;
            config.logger.appenders[0].file = 'custom_appender';
            configurator._createLayout.andCallFake(function () {
                return {};
            });

            configurator._createAppender(config.logger.appenders[0], component);

            expect(configurator._createLayout)
                    .toHaveBeenCalledWith(config.logger.appenders[0].layout, component);
        });

        it('should throw an error if the custom appender has errors', function () {
            config.logger.appenders[0].type = 'console_colors';
            configurator._createLayout.andCallFake(function () {
                return {};
            });

            expect(function () {
                configurator._createAppender(config.logger.appenders[0]);
            }).toThrow('custom error');
        });

        it('should log with error level if the custom appender has errors', function () {
            config.logger.appenders[0].type = Configurator.CUSTOM_TYPE;
            config.logger.appenders[0].file = 'custom_appender_with_error';
            configurator._createLayout.andCallFake(function () {
                return {};
            });

            var appender = configurator._createAppender(config.logger.appenders[0], component);

            expect(appender).toBeUndefined();
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('_createLayout', function () {
        var createLayout;

        beforeEach(function () {
            configurator = Configurator.get();
            configurator._createLayout.andCallThrough();

            configurator._layoutConstructors = {
                'pattern': PatternLayout,
                'all': AllLayout
            };

            PatternLayout.andReturn(layout1);

            createLayout = function () {
                configurator._createLayout(config.logger.appenders[0].layout);
            };
        });

        it('should log with error level if the layout is missing', function () {
            config.logger.appenders[0].layout.type = Configurator.CUSTOM_TYPE;
            config.logger.appenders[0].layout.file = 'invalid_custom_layout';

            var layout = configurator._createLayout(config.logger.appenders[0].layout, component);
            expect(layout).toBeUndefined();
            expect(logger.error).toHaveBeenCalled();
        });

        it('should throw an error if the layout and the component are invalid', function () {
            config.logger.appenders[0].layout.type = 'invalid type';

            expect(createLayout).toThrowType(RainError.ERROR_PRECONDITION_FAILED,
                                               'component config');
        });

        it('should log with error level if the layout type is invalid', function () {
            config.logger.appenders[0].layout.type = 'invalid type';

            var layout = configurator._createLayout(config.logger.appenders[0].layout, component);
            expect(layout).toBeUndefined();
            expect(logger.error).toHaveBeenCalled();
        });

        it('should create a layout', function () {
            var layout = configurator._createLayout(config.logger.appenders[0].layout);

            expect(layout).toBe(layout1);
        });

        it('should throw an error if the layout has errors', function () {
            config.logger.appenders[0].layout.type = 'all';

            expect(function () {
                configurator._createLayout(config.logger.appenders[0].layout);
            }).toThrow('custom error');
        });

        it('should log with error level if the layout has errors', function () {
            config.logger.appenders[0].layout.type = Configurator.CUSTOM_TYPE;
            config.logger.appenders[0].layout.file = 'all_with_error';

            var layout = configurator._createLayout(config.logger.appenders[0].layout, component);

            expect(layout).toBeUndefined();
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getAppenders', function () {

        var getAppenders;

        beforeEach(function () {
            configurator = Configurator.get();

            getAppenders = function () {
                configurator.getAppenders(component);
            };
        });

        it('should return empty array if logger configuration is missng', function () {
            config.logger = undefined;

            expect(configurator.getAppenders(component)).toEqual([]);
        });

        it('should throw an error if the logger value is invalid', function () {
            config.logger.level = 'invalid level';

            expect(getAppenders).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'level');
        });

        it('should return the platform appenders', function () {
            Configurator.prototype._createAppender.andCallFake(function () {
                return {};
            });
            var appenders = configurator.getAppenders();

            expect(appenders.length).toEqual(2);
            expect(Configurator.prototype._createAppender.callCount).toEqual(2);
        });

        it('should return empty array if the component is missing', function () {
            componentConfig = undefined;
            var appenders = configurator.getAppenders(component);

            expect(appenders.length).toEqual(0);
            expect(logger.error).toHaveBeenCalled();
        });

        it('should return empty array if the component\'s logger config is missing', function () {
            componentConfig = component;
            var appenders = configurator.getAppenders(component);

            expect(appenders.length).toEqual(0);
            expect(logger.error).not.toHaveBeenCalled();
        });
    });
});

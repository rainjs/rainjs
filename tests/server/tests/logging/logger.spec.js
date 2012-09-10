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
    var Logger, appendersSpy, component;

    beforeEach(function () {
        var mocks = {};

        component = {
            id: 'example',
            version: '1.0'
        };

        mocks['./event'] = jasmine.createSpy('Event');
        appendersSpy = jasmine.createSpyObj('appenders', ['getAppenders']);
        appendersSpy.getAppenders.andCallFake(function (component) {
            return component ? ['a1', 'a2'] : ['a3'];
        });
        mocks['./configurator'] = {
            get: function () {
                return appendersSpy;
            }
        };

        mocks['./logger_levels'] = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
            fatal: 4
        };

        Logger = loadModuleExports('/lib/logging/logger.js', mocks);
    });

    describe('Get a logger instance', function () {

        it('should get the platform logger', function () {
            var platformLogger = Logger.get();

            expect(platformLogger).toBe(Logger._platformLogger);
            expect(appendersSpy.getAppenders).toHaveBeenCalledWith();
            expect(platformLogger._appenders.length).toBe(1);
        });

        it('should get the component logger', function () {
            var componentLogger = Logger.get(component),
                cid = component.id + ';' + component.version;

            expect(Logger._platformLogger).toBeDefined();
            expect(appendersSpy.getAppenders).toHaveBeenCalledWith(component);
            expect(componentLogger).toBe(Logger._componentLoggers[cid]);
            expect(componentLogger._logger).toBe(cid);
            expect(componentLogger._appenders.length).toBe(2);
            expect(componentLogger._inheritedAppenders.length).toBe(1);
            expect(componentLogger._allAppenders.length).toBe(3);
        });
    });

    describe('Destroy the loggers', function () {

        it('should destroy all loggers', function () {
            var componentLogger = Logger.get(component);

            spyOn(componentLogger, '_destroy');
            spyOn(Logger._platformLogger, '_destroy');

            Logger.destroyAll();

            expect(componentLogger._destroy).toHaveBeenCalled();
            expect(Logger._platformLogger._destroy).toHaveBeenCalled();
        });
    });

    describe('Log methods', function () {

        it('should call _log with the correct level', function () {
            var logger = Logger.get(),
                levels = ['debug', 'info', 'warn', 'error', 'fatal'],
                error = {
                    message: 'some error'
                };

            var appender = jasmine.createSpyObj('appender', ['append']);
            logger._allAppenders = [appender];
            spyOn(logger, '_log').andCallThrough();

            for (var i = 0, len = levels.length; i < len; i++) {
                logger[levels[i]]('message', error);
                expect(logger._log).toHaveBeenCalledWith(levels[i], 'message', error);
                expect(appender.append).toHaveBeenCalled();
            }
        });
    });
});

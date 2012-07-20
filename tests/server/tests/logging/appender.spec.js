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

describe('abstract appender', function () {
    describe('append', function () {
        var mocks, Spy, Appender;
        var Levels = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
        var appender, message;

        beforeEach(function () {
            Spy = {};
            Spy.Event = jasmine.createSpyObj('Spy.Event', ['level']);
            Spy.Layout = jasmine.createSpyObj('Spy.Layout', ['format']);

            mocks = {};
            mocks['./logger'] = { LEVELS: Levels };

            Appender = loadModuleExports(path.join('lib', 'logging', 'appender.js'), mocks);

            message = 'message';
            spyOn(Appender.prototype, '_write');
            Spy.Layout.format.andReturn(message);
        });

        it('should log if the event\'s level is greater than the logger\'s level', function () {
            appender = new Appender('info', Spy.Layout);
            Spy.Event.level.andReturn('error');

            appender.append(Spy.Event);

            expect(Spy.Layout.format).toHaveBeenCalledWith(Spy.Event);
            expect(appender._write).toHaveBeenCalledWith(message, Spy.Event);
        });

        it('should log if the event\'s level is equal to the logger\'s level', function () {
            appender = new Appender('warn', Spy.Layout);
            Spy.Event.level.andReturn('warn');

            appender.append(Spy.Event);

            expect(Spy.Layout.format).toHaveBeenCalledWith(Spy.Event);
            expect(appender._write).toHaveBeenCalledWith(message, Spy.Event);
        });

        it('shouldn\'t log if the event\'s level is less than the logger\'s level', function () {
            appender = new Appender('error', Spy.Layout);
            Spy.Event.level.andReturn('debug');

            appender.append(Spy.Event);

            expect(Spy.Layout.format).not.toHaveBeenCalled();
            expect(appender._write).not.toHaveBeenCalled();
        });
    });
});

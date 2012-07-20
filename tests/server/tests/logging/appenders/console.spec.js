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

describe('Console appender', function () {
    var Appender, ConsoleAppender, layout, mocks, event, options;
    beforeEach(function () {
        mocks = {};
        mocks['../appender'] = Appender = jasmine.createSpy('Appender');
        layout = jasmine.createSpyObj('layout', ['format']);
        event = jasmine.createSpyObj('event', ['level', 'message', 'error', 'logger']);
        event.logger.andReturn('RAIN');
        layout.format.andReturn('Some message');

        spyOn(console, 'log');

        options = {
            "debug": {
                "foreground": "green"
            },
            "info": {
                "foreground": "cyan"
            },
            "warn": {
                "foreground": "yellow"
            },
            "error": {
                "foreground": "red"
            },
            "fatal": {
                "foreground": "black",
                "background": "red"
            }
        };

        ConsoleAppender = loadModuleExports(path.join('lib', 'logging', 'appenders', 'console.js'),
                                            mocks);
    });

    it('should call the parent constructor', function () {
        new ConsoleAppender(0, layout, options);

        expect(Appender).toHaveBeenCalled();
    });

    it("should corectly format a debug message", function () {
        event.level.andReturn('debug');
        var appender = new ConsoleAppender('debug', layout, options);

        appender._write('Some message', event);
        expect(console.log).toHaveBeenCalledWith('\u001b[32mSome message\u001b[39m');
    });

    it("should corectly format an info message", function() {
        event.level.andReturn('info');
        var appender = new ConsoleAppender('info', layout, options);

        appender._write('Some message', event);
        expect(console.log).toHaveBeenCalledWith('\u001b[36mSome message\u001b[39m');
    });

    it("should corectly format a warning message", function() {
        event.level.andReturn('warn');
        var appender = new ConsoleAppender('warn', layout, options);

        appender._write('Some message', event);
        expect(console.log).toHaveBeenCalledWith('\u001b[33mSome message\u001b[39m');
    });

    it("should corectly format an error message", function() {
        event.level.andReturn('error');
        var appender = new ConsoleAppender('error', layout, options);

        appender._write('Some message', event);
        expect(console.log).toHaveBeenCalledWith('\u001b[31mSome message\u001b[39m');
    });

    it("should corectly format a fatal message", function() {
        event.level.andReturn('fatal');
        var appender = new ConsoleAppender('fatal', layout, options);

        appender._write('Some message', event);
        expect(console.log).toHaveBeenCalledWith('\u001b[30m\u001b[41mSome message\u001b[39m\u001b[49m');
    });

    it("shouldn't color messages on windows", function() {
        var platform = process.platform;

        event.level.andReturn('fatal');
        process.platform = 'win32';
        var appender = new ConsoleAppender('fatal', layout, options);

        appender._write('Some message', event);
        expect(console.log).toHaveBeenCalledWith('Some message');

        process.platform = platform;
    });
});

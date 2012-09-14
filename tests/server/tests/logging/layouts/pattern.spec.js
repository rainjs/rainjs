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

describe("Pattern layout", function() {
    var Pattern, event,
    params = {
        "pattern": "[%%%level%%] %date: %message"
    };

    beforeEach(function () {
        var date = jasmine.createSpyObj('date', [
            'getDate', 'getMonth', 'getFullYear',
            'getHours', 'getMinutes', 'getSeconds'
        ]);
        Pattern = loadModuleExports(path.join('lib', 'logging', 'layouts', 'pattern.js'));
        event = jasmine.createSpyObj('event', ['date', 'level', 'logger', 'message']);
        event.date.andReturn(date);
        event.level.andReturn('info');
        event.logger.andReturn('RAIN');
        event.message.andReturn('Custom message');

        date.getDate.andReturn(1);
        date.getMonth.andReturn(1);
        date.getFullYear.andReturn(1970);
        date.getHours.andReturn(1);
        date.getMinutes.andReturn(1);
        date.getSeconds.andReturn(1);
    });

    it("should be properly constructed", function () {
        var layout = new Pattern(params);

        expect(layout._pattern).toEqual('%date|%level|%logger|%message|' +
                                        '%newline|%stacktrace|%source|%%');
    });

    it("should corectly calculate the date", function () {
        var layout = new Pattern(params);

        expect(layout._placeholders.date(event)).toEqual('02/01/1970 01:01:01');
    });

    it("should corectly determine the newline format", function () {
        var layout = new Pattern(params),
            platform = process.platform;

        process.platform = 'linux';
        expect(layout._placeholders.newline()).toEqual('\n');

        process.platform = 'darwin';
        expect(layout._placeholders.newline()).toEqual('\r');

        process.platform = 'win32';
        expect(layout._placeholders.newline()).toEqual('\r\n');

        process.platform = 'solaris';
        expect(layout._placeholders.newline()).toEqual('\n');

        process.platform = 'freebsd';
        expect(layout._placeholders.newline()).toEqual('\n');

        process.platform = platform;
    });

    it("should corectly format the message", function () {
        var layout = new Pattern(params);

        expect(layout.format(event)).toEqual('[%info%] 02/01/1970 01:01:01: Custom message');
    });
});

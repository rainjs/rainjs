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

describe("Format Helpers", function () {
    var mocks = {},
        fs,
        Formatter,
        poText;

    beforeEach(function () {

        mocks['./configuration'] =  {
            "format": {
                "default_date": "MM/DD/YYYY",
                "default_time": "hh:mm",
                "default_range": "MMMM DD, YYYY",
                "default_percentage": "%s%%",
                "default_currency": "%s$",
                "default_thousand_separator": ".",
                "default_decimal_separator": ","
            },

            "defaultLanguage": "en_US"
        };

        mocks['./logging'] = {
            get: function () {
                return jasmine.createSpyObj('logger', ['error']);
            }
        };

        //mock fs
        poText = 'msgid "currency.format"\n' +
            'msgstr "$%s"\n\n' +
            'msgid "percentage.format"\n' +
            'msgstr "%s%%"\n\n' +
            'msgid "decimal.separator"\n' +
            'msgstr "."\n\n' +
            'msgid "thousand.separator"\n' +
            'msgstr ","\n\n' +
            'msgid "date.format"\n' +
            'msgstr "MM/DD/YYYY"\n\n' +
            'msgid "time.format"\n' +
            'msgstr "hh:mm a"\n\n' +
            'msgid "range.format"\n' +
            'msgstr "MMMM DD, YYYY"\n';
        fs = jasmine.createSpyObj('fs', ['readFileSync']);
        mocks['fs'] = fs;
        fs.readFileSync.andCallFake(function () {
            var data = poText;
            return data;
        });

        //mock util.walkSync
        mocks['./util'] = util = jasmine.createSpyObj('util', ['walkSync']);
        util.walkSync.andCallFake(function (folder, extensions, callback) {
            callback('/en_EN/messages.po');
        });

        Formatter = loadModuleExports('/lib/format.js', mocks);

    });

    describe("Singleton method", function () {
        it('should construct the object only once', function () {
            var frm1 = Formatter.get();
            var frm2 = Formatter.get();

            expect(frm1).toBe(frm2);
        });
    });

    describe("formatDate method", function () {
        it('should return the date formatted according to the specified language', function () {
            util.walkSync.andCallFake(function (folder, extensions, callback) {
                callback('/de_DE/messages.po');
            });
            var frm = Formatter.get();
            var formattedDate =  frm.formatDate(new Date(2013, 8, 17), 'en_EN');

            expect(formattedDate).toEqual('09/17/2013');
        });

        it('should return the date formatted according to the default language', function () {
            var frm = Formatter.get();
            var formattedDate =  frm.formatDate(new Date(2013, 8, 17), 'de_DE');

            expect(formattedDate).toEqual('09/17/2013');
        });
    });

    describe("formatTime method", function () {
        it('should return the time formatted according to the specified language', function () {
            var frm = Formatter.get();
            var meetingDateAndTime = new Date(2013, 8, 17, 2, 34, 50);
            var formattedTime =  frm.formatTime(meetingDateAndTime, 'en_EN');

            expect(formattedTime).toEqual('02:34 am');
        });

        it('should return the time formatted according to the default language', function () {
            var frm = Formatter.get();
            var meetingDateAndTime = new Date(2013, 8, 17, 2, 34, 50);
            var formattedTime =  frm.formatTime(meetingDateAndTime, 'de_DE');

            expect(formattedTime).toEqual('02:34');
        });
    });

    describe("formatRange method", function () {
        it('should return the date range formatted according to the specified language', function () {
            var frm = Formatter.get();
            var startDate = new Date(2013, 8, 17);
            var endDate = new Date(2014, 10, 17);
            var formattedDateRange =  frm.formatRange(startDate, endDate, 'en_EN');

            expect(formattedDateRange).toEqual('September 17, 2013 - November 17, 2014');
        });

        it('should return the date range formatted according to the default language', function () {
            var frm = Formatter.get();
            var startDate = new Date(2013, 8, 17);
            var endDate = new Date(2013, 8, 29);
            var formattedDateRange =  frm.formatRange(startDate, endDate, 'de_DE');

            expect(formattedDateRange).toEqual('September 17 - September 29, 2013');
        });
    });

    describe("formatNumber method", function () {
        it('should return the number formatted according to the specified language', function () {
            var frm = Formatter.get();
            var formattedNumber =  frm.formatNumber('1200200.34123', 'en_EN');

            expect(formattedNumber).toEqual('1,200,200.34123');
        });

        it('should return the number formatted according to the default language', function () {
            var frm = Formatter.get();
            var formattedNumber =  frm.formatNumber('1200200.34123', 'de_DE');

            expect(formattedNumber).toEqual('1.200.200,34123');
        });

    });

    describe("formatPercentage method", function () {
        it('should return the percentage formatted according to the specified language', function () {
            var frm = Formatter.get();
            var formattedNumber =  frm.formatPercentage('76.437', 'en_EN');

            expect(formattedNumber).toEqual('76.44%');
        });

        it('should return the percentage formatted according to the default language', function () {
            var frm = Formatter.get();
            var formattedNumber =  frm.formatPercentage('76.437', 'de_DE');

            expect(formattedNumber).toEqual('76,44%');
        });

    });

    describe("formatCurrency method", function () {
        it('should return the currency formatted according to the specified language', function () {
            var frm = Formatter.get();
            var formattedNumber =  frm.formatCurrency('7644561.437', 'en_EN');

            expect(formattedNumber).toEqual('$7,644,561.44');
        });

        it('should return the currency formatted according to the default language', function () {
            var frm = Formatter.get();
            var formattedNumber =  frm.formatCurrency('7644561.437', 'de_DE');

            expect(formattedNumber).toEqual('7.644.561,44$');
        });
    });

});

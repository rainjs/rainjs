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

var jsonString = '{"foo": "bar"}',
    malformedJsonString = '{foo": "bar"}',
    jsonObject = {foo: "bar"};

describe('RequireJS locale plugin', function () {
    it('should be able to load a JSON string',
        ['locale', 'text'],
        function (locale, text) {
            var parsed = null;

            runs(function () {
                text.get.andCallFake(function (res, cb) {
                    cb(jsonString);
                });
                locale.load.andCallThrough();
                locale.load(null, null, function (data) {
                    parsed = data;
                });
            });

            waitsFor(function () {
                return parsed;
            });

            runs(function () {
                expect(parsed).toEqual(jsonObject);
            });
        });

    it('should return an empty object in case of a malformed JSON string',
        ['locale', 'text'],
        function (locale, text) {
            var parsed = null;
            runs(function () {
                text.get.andCallFake(function (res, cb) {
                    cb(malformedJsonString);
                });
                locale.load.andCallThrough();
                locale.load(null, null, function (data) {
                    parsed = data;
                });
            });

            waitsFor(function () {
                return (parsed !== null);
            });

            runs(function () {
                expect(parsed).toEqual({});
            });
        });

    it('should return the same name when normalized', ['locale'], function (locale) {
        locale.normalize.andCallThrough();
        expect(locale.normalize('test-string')).toEqual('test-string');
    });
});

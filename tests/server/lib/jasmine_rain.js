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

var cwd = process.cwd();
require(cwd + '/lib/globals');

var loadFile = require(cwd + '/tests/server/rain_mocker');

jasmine.util.extend(jasmine.getGlobal(), (function () {

    /**
    * Sets up spies and other useful utilities
    * for testing Rain with jasmine.
    *
    * @name JasmineRain
    * @class Utility class extending jasmine for testing Rain specific code
    * @constructor
    */
    function JasmineRain() {
        // Setup all behavior in a runner beforeEach
        beforeEach(function () {
            //adds custom matchers to jasmine
            //https://github.com/pivotal/jasmine/wiki/Matchers
            this.addMatchers({
                toThrowType: toThrowType
            });
        });
    }

    /**
     * Matcher that checks the type of an exception. The exception should be a RainError
     *
     * @param type the type value
     * @returns {Bool} whether the expectation was fulfilled or not
     */
    function toThrowType(type, code) {
        var actual = this.actual;

        try {
            actual();
        } catch (e) {
            this.message = function () {
                return "Expected function to throw RainError with type `" + type +
                    (code ? '` and code `' + code + '`': '') +
                    ", but the type is `" + e.type + (code ? '` and code is `' + e.code + '`' : '');
            };

            return e instanceof RainError && e.type === type && (code !== undefined ? e.code === code : true);
        }

        this.message = function () {
            return "Expected function to throw RainError with type `" + type +
                (code ? '` and code `' + code + '`' : '') + ", but no error was thrown.";
        };

        return false;
    }

    /**
     *
     * @param {String} modulePath Path to the module related to the process cwd
     * @returns The module with access to all private variables and functions too.
     */
    JasmineRain.prototype.getModule = function(modulePath) {
        return loadFile(cwd + modulePath, null, true);
    };

    return new JasmineRain();
}()));


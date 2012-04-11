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


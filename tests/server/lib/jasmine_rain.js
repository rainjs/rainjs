"use strict";

require(process.cwd() + '/lib/globals');

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

beforeEach(function () {
    //adds custom matchers to jasmine
    //https://github.com/pivotal/jasmine/wiki/Matchers
    this.addMatchers({
        toThrowType: toThrowType
    });
});


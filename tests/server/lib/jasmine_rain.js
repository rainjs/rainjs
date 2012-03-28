"use strict";

require(process.cwd() + '/lib/globals');

/**
 * Matcher that checks the type of an exception. The exception should be a RainError
 *
 * @param expected the expected value
 * @returns {Bool} whether the expectation was fulfilled or not
 */
function toThrowType(expected) {
    var actual = this.actual;

    try {
        actual();
    } catch (e) {
        this.message = function () {
            return "Expected function to throw RainError with type " + expected +
                ", but the type is " + e.type;
        };

        return e instanceof RainError && e.type === expected;
    }

    this.message = function () {
        return "Expected function to throw RainError with type " + expected +
            ", but no error was thrown.";
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


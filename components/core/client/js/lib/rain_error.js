(function (define) {
define(function (require, exports, module) {
"use strict";

var util = require('util');

/**
 * Global RAIN error.
 *
 * @param {String} [message='unknown error'] the error message, accepting placeholders in printf's style
 * @param {Array} [args=[]] a list of placeholder values for the message
 * @param {String} [type=undefined] the error type
 * @param {String} [code=undefined] the error code
 */
var RainError = function (message, args, type, code) {
    var error = new Error();

    // identify arguments
    if (!Array.isArray(args)) {
        code = type;
        type = args;
        args = [];
    }

    // calling util.format with apply needs all arguments in one place
    args.unshift(message || 'unknown error');

    // format the message with the possible arguments
    error.message = util.format.apply(util, args);
    error.type = type;
    error.code = code;

    // fix stack: remove call to Error() from this constructor
    var stack = error.stack.split('\n');
    stack.splice(1, 1);
    error.stack = stack.join('\n');

    return error;
};

/**
 * Predefined error types.
 */
RainError.ERROR_IO = 0;
RainError.ERROR_NET = 1;
RainError.ERROR_PRECONDITION_FAILED = 2;

util.inherits(RainError, Error);

// make RainError global
(typeof window === 'undefined' ? global : window).RainError = RainError;

});
})(typeof define !== 'undefined' ? define : function (factory) { factory(require, exports, module); });

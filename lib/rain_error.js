var util = require('util');

/**
 * Global RAIN error.
 *
 * @param {String} [message='Unknown error'] the error message
 * @param {String} [type=undefined] the error type
 * @param {String} [code=undefined] the error code
 */
RainError = function (message, type, code) {
    var e = new Error(message || 'Unknown error');
    var stack = e.stack.split('\n');
    stack.splice(1, 1);

    e.stack = stack.join('\n');
    e.type = type;
    e.code = code;
    return e;
};

//util.inherits(RainError, Error);

/**
 * Predefined error types
 */
RainError.ERROR_IO = 0;
RainError.ERROR_NET = 1;

global.RainError = RainError;

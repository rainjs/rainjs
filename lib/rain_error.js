var util = require('util');

/**
 * Global RAIN error.
 *
 * @param {String} [message='Unknown error'] the error message
 * @param {Error} [error] the previous error
 * @param {String} [type=undefined] the error type
 * @param {String} [code=undefined] the error code
 */
RainError = function (message, error, type, code) {
    message = message || 'Unknown error';
    var e = new Error(message);

    if (typeof error == 'object') {
        e.stack = error.stack;
    } else {
        type = error;
        code = type;
        var stack = e.stack.split('\n');
        stack.splice(1, 1);
        e.stack = stack.join('\n');
    }

    if (type) {
        e.type = type;
    } else {
        code = type;
    }

    if (code) {
        e.code = code;
    }

    return e;
};


/**
 * Predefined error types
 */
RainError.ERROR_IO = 0;
RainError.ERROR_NET = 1;

global.RainError = RainError;

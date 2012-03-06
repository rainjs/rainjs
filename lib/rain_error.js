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
    var stack;

    if (typeof error == 'object') {
        stack = error.stack.split('\n');
        stack.splice(0, 1);
    } else {        
        code = type;
        type = error;
        stack = e.stack.split('\n');
        stack.splice(0, 2);       
    }

    stack.unshift('RainError: ' + message);
    e.stack = stack.join('\n');   
    
    e.type = type;   
    e.code = code;

    return e;
};


/**
 * Predefined error types
 */
RainError.ERROR_IO = 0;
RainError.ERROR_NET = 1;
RainError.ERROR_PRECONDITION_FAILED = 2;

global.RainError = RainError;

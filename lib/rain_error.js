var util = require('util');

/**
 * Global RAIN error.
 *
 * @param {String} [message='Unknown error'] the error message
 * @param {String} [type=undefined] the error type
 * @param {String} [code=undefined] the error code
 */
RainError = function (message, type, code) {
    this.message = message || 'Unknown error';
    this.type = type;
    this.code = code;
};

util.inherits(RainError, Error);

/**
 * Predefined error types
 */
RainError.ERR_IO = 0;
RainError.ERR_NET = 1;

global.RainError = RainError;

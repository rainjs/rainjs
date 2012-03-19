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
    /**
     * The stack trace is only captured when an Error object is instantiated.
     * Capture the stack here, by using the V8 StackTrace API, documented
     * at {@link http://code.google.com/p/v8/wiki/JavaScriptTraceApi}.
     */
    Error.captureStackTrace(this, RainError);

    // identify arguments
    if (!Array.isArray(args)) {
        code = type;
        type = args;
        args = [];
    }

    // calling util.format with apply needs all arguments in one place
    args.unshift(message || 'unknown error');

    this.message = util.format.apply(util, args);
    this.type = type;
    this.code = code;
};

/**
 * Predefined error types.
 */
RainError.ERROR_IO = 0;
RainError.ERROR_NET = 1;
RainError.ERROR_PRECONDITION_FAILED = 2;

util.inherits(RainError, Error);

global.RainError = RainError;

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

(function (define) {
"use strict";

define(function (require, exports, module) {

// Note: strict mode cannot be used because of arguments.callee and related properties

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
    // identify arguments
    if (!Array.isArray(args)) {
        code = type;
        type = args;
        args = [];
    }

    // calling util.format with apply needs all arguments in one place
    args.unshift(message || 'unknown error');

    // format the message with the possible arguments
    this.message = util.format.apply(util, args);
    this.type = type;
    this.code = code;

    // generate a stack with the correct message on the first line
    var error = new Error(this.message);

    this.stack = new StackTraceFormatter(error).format();
};

/**
 * Predefined error types.
 */
RainError.ERROR_IO = 0;
RainError.ERROR_NET = 1;
RainError.ERROR_PRECONDITION_FAILED = 2;
RainError.ERROR_HTTP = 3;
RainError.ERROR_SOCKET = 4;
RainError.ERROR_AUTHORIZATION = 5;

util.inherits(RainError, Error);

/**
 * Cross-browser stack trace formatter.
 * Supports Firefox, Chrome, IE and Safari as well as node.js.
 *
 * Note: it currently does not aim to reproduce the same stack trace
 * for every browser.
 *
 * @name StackTraceFormatter
 * @param {Error} error the thrown error
 * @property {Error} error
 * @property {String} implementation the stack formatter implementation used
 * @constructor
 */
function StackTraceFormatter(error) {
    this.error = error;

    // determine implementation
    if (error.stack) {
        if ('arguments' in error) {
            this.implementation = 'Chrome';
        } else {
            this.implementation = 'Firefox';
        }
    } else {
        this.implementation = 'IE';
    }
}

/**
 * Formats the stack trace for a meaningful inspection.
 * Removes the inner functions from RAIN that appear at the top of the stack
 * and ensures cross-browser functionality (e.g. IE support).
 *
 * @returns {String} the formatted stack trace
 */
StackTraceFormatter.prototype.format = function () {
    return this['_format' + this.implementation]();
};

/**
 * Implements the formatter for Chrome(thus V8, including node.js).
 *
 * @returns {String} the formatted stack trace
 */
StackTraceFormatter.prototype._formatChrome = function () {
    var stack = this.error.stack.split('\n');
    stack.splice(1, 1);
    return stack.join('\n');
};

/**
 * Implements the formatter for Firefox.
 *
 * @returns {String} the formatted stack trace
 */
StackTraceFormatter.prototype._formatFirefox = function () {
    return this.error.stack;
};

/**
 * Implements the formatter for IE.
 * Since this browser don't support the ``Error.stack`` property,
 * this is simulated by going up the call stack using the ``callee``
 * and ``caller`` properties of function objects.
 *
 * Note: this does not work in "strict" mode, since ``caller`` isn't available there.
 *
 * @returns {String} the formatted stack trace
 */
StackTraceFormatter.prototype._formatIE = function () {
    var re = /function\s*([\w$]+)?\s*\(/i,
        fn = arguments.callee.caller,
        stack = ['RainError: ' + this.error.message],
        maxStackSize = 11,
        result, name;

    // skip the inner functions until the last useful function
    for (var i = 3; i--; fn = fn.caller)
        ;

    while (fn && stack.length < maxStackSize) {
        // try to obtain the function name
        result = re.exec(fn.toString());

        name = result && result[1] ? result[1] : 'anonymous';

        stack.push('\tat ' + name);

        fn = fn.caller;
    }

    return stack.join('\n');
};

// make RainError global
(typeof window === 'undefined' ? global : window).RainError = RainError;

});
})(typeof define !== 'undefined' ? define : function (factory) { factory(require, exports, module); });

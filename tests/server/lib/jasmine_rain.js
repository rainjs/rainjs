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

"use strict";

var fs = require('fs'),
    path = require('path'),
    vm = require('vm'),
    extend = require('node.extend'),
    Promise = require('promised-io/promise'),
    Deferred = Promise.Deferred;

require('../../../lib/globals');

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
     * Cache for module code to avoid reading the file multiple times if the
     * the same module is requested more than once.
     *
     * @type {Object}
     */
    var code = {};

    /**
     * Loads a module and returns it's entire context.
     * Convenience method for :js:func`JasmineRain#loadModule` with the last parameter set to true.
     *
     * @see :js:func:`JasmineRain#loadModule`
     */
    JasmineRain.prototype.loadModuleContext = function () {
        var args = [];
        for (var i = 0, l = arguments.length; i < l; i++) {
            args.push(arguments[i]);
        }

        // complete argument list with missing parameters until the last one
        l = loadModule.length - 1;
        while (i++ < l) {
            args.push(null);
        }

        return loadModule.apply(null, args.concat([true]));
    };

    /**
     * Loads a module and returns it's exports object.
     * Convenience method for :js:func`JasmineRain#loadModule` with the last parameter set to false.
     *
     * @see :js:func:`JasmineRain#loadModule`
     */
    JasmineRain.prototype.loadModuleExports = function () {
        var args = [];
        for (var i = 0, l = arguments.length; i < l; i++) {
            args.push(arguments[i]);
        }

        // complete argument list with missing parameters until the last one
        l = loadModule.length - 1;
        while (i++ < l) {
            args.push(null);
        }

        return loadModule.apply(null, args.concat([false]));
    };

    /**
     * Loads a module by sandboxing it and making all it's local scope available to the caller.
     * Mocking private functions for unit testing hasn't been easier.
     *
     * @param {String} modpath the module's file path
     * @param {Object} mocks an object containing properties with filename keys and
     * values that will be used in place of the original module's exports object
     * @param {Object} deps an object containing properties with variable names
     * and values that will be used for mocked dependencies injected into the loaded module
     * @param {Boolean} all whether to return the full context or just the exports object
     * @returns {Object} the loaded module's context
     */
    JasmineRain.prototype.loadModule = function(modpath, mocks, deps, all) {
        mocks = mocks || {};
        deps = deps || {};

        var file;
        if (process.env.RAIN_COVERAGE == 1) {
            file = path.join(process.cwd(), 'instrumented', modpath);
        } else {
            file = path.join(process.cwd(), modpath);
        }

        if (!code[file]) {
            // Use sync version because `require` is sync, so that's what the user expects
            code[file] = fs.readFileSync(file, 'utf8');
        }

        var context = vm.createContext(global);
        /*
            Extend the context with module specific properties
            and provided mock dependencies.
        */
        extend(
            context,
            {
                require: sandboxRequire.bind(null, file, mocks),
                module: { exports: {} },
                __filename: path.resolve(file)
            }
        );

        // Some more augmentation
        context.exports = context.module.exports;
        context.__dirname = path.dirname(context.__filename);
        if(!context.logger) {
            context.logger = {
                info: function (){},
                warn: function (){},
                error: function (){},
                debug: function (){},
                fatal: function (){}
            };
        }

        //add deps at the end in order to be able to override properties like __dirname and __filename
        extend(context, deps);

        code[file] = code[file].replace(/^\#\!.*/, ''); // strip shebang
        // Run the module in the the created context
        vm.runInContext(code[file], context, file);

        return all ? context : context.module.exports;
    };

    /**
     * Wraps require() to test if a mocked module has been
     * provided matching a filename, returning the mock in this case
     * or defaulting to requiring it in the standard node way otherwise.
     *
     * @param {String} file sandboxed module's path needed for loading modules relative to it
     * @param {Object} mocks an object containing properties with filename keys and
     * values that will be used in place of the original module's exports object
     * @param {String} mod the required module's file path
     */
    function sandboxRequire(file, mocks, mod) {
        mod = mod || '';
        mocks = mocks || {};

        if (mocks[mod]) {
            return mocks[mod];
        }

        if (mod.indexOf('./') === 0 || mod.indexOf('../') === 0) {
            return require(path.resolve(path.join(path.dirname(file), mod)));
        }

        return require(mod);
    }

    return new JasmineRain();
}()));

if (!jasmine.Spy.prototype.andDefer) {
    /**
     * Makes the spy asynchronously fulfill a promise.
     *
     * The spy returns a promise and fulfills it on next tick with the
     * user supplied fulfill function that receives the deferred object
     * that controls the promise.
     * @param {Function} fulfill the function that fulfills the promise
     * @returns {jasmine.Spy} the spy
     * @example
     *      jasmine.createSpy().andDefer(function (deferred) {
     *          deferred.resolve({success: true});
     *      });
     *
     *      jasmine.createSpy().andDefer(function (deferred)) {
     *          deferred.reject({error: true});
     *      });
     */
    jasmine.Spy.prototype.andDefer = function (fulfill) {
        this.andCallFake(function () {
            var deferred = new Deferred();

            process.nextTick(function () {
                fulfill(deferred);
            });

            return deferred.promise;
        });

        return this;
    };
}

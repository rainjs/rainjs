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
        var self = this;

        /**
         * Holds promises returned by mocked ajax calls.
         * Can be used to resolve with desired data.
         *
         * @type {Array}
         * @private
         * @memberOf JasmineRain#
         */
        this.ajaxCalls = [];

        /**
         * References the most recent call in the ajaxCalls property.
         *
         * @type {jQuery.Deferred|null}
         */
        this.ajaxCalls.mostRecent = null;

        /**
         * References by name the modules loaded through jasmine
         *
         * @type {Object}
         */
        jasmine.loadedModules = {};

        // Setup all behavior in a runner beforeEach
        beforeEach(function () {
            setup.call(this, self);
        });
    }

    /**
     * Sets up all spies and matchers.
     *
     * @param {JasmineRain} self the class instance
     * @private
     * @memberOf JasmineRain#
     */
    function setup(self) {
        spyOn($, 'ajax').andCallFake(
            function () {
                return ajaxMock(self);
            }
        );

        this.addMatchers({
            toThrowType: matchThrowType
        });
    }

    /**
     * Matcher that checks the type of an exception
     * by following rain's conventions.
     *
     * @param expected the expected value
     * @returns {Bool} whether the expectation was fulfilled or not
     * @see <a href="https://github.com/pivotal/jasmine/wiki/Matchers">jasmine API documentation on Matchers</a>
     */
    function matchThrowType(expected) {
        var reErrorType = new RegExp('^' + expected + ':');

        try {
            this.actual();
        } catch (e) {
            return reErrorType.test(e.message);
        }
    }

    /**
     * Mocks the jQuery ajax call.
     * Returns and stores promises for each call that can be later
     * accessed via the {@link ajaxCalls} property and resolved or rejected.
     *
     * @param {JasmineRain} self the class instance
     * @private
     * @memberOf JasmineRain#
     */
    function ajaxMock(self) {
        var deferred = new $.Deferred();

        self.ajaxCalls.push(deferred);
        self.ajaxCalls.mostRecent = self.ajaxCalls[self.ajaxCalls.length - 1];

        return deferred;
    }

    /**
     * Original jasmine it() method
     *
     * @type {Function}
     */
    var jasmineIt = it;

    /**
     * Extends jasmine's it() to asynchronously load dependencies via
     * requirejs before running the spec.
     *
     * @param {String} description the spec's description
     * @param {Array} modules the list of dependencies
     * @param {Function} func the spec
     * @returns {jasmine.Spec} the jasmine Spec instance
     * @see jasmine API documentation
     */
    JasmineRain.prototype.it = function (description, modules, func) {
        if (!func) {
            func = modules;
            modules = [];
        }

        var deps = [];

        return jasmineIt(description, function () {
            runs(function () {
                if (modules.length === 0) {
                    return;
                }

                require(modules, function () {
                   deps = Array.prototype.slice.call(arguments, 0);
                });
            });

           waitsFor(function () {
               return deps.length === modules.length;
           });

           runs(function () {
                for (var name in jasmine.loadedModules) {
                    mock(jasmine.loadedModules[name]);
                }

                func.apply(this, deps);
           });
        });
    };

    /**
     * Creates spies for all the methods inside a module.
     *
     * @param {Object} module the module to be mocked
     * @returns {Object} the mocked module
     */
    JasmineRain.prototype.mock = function (module) {
        var prototype = module && (module.prototype || {}),
            f;

        for(f in module) {
            if (typeof module[f] != 'function') {
                continue;
            }

            if (jasmine.isSpy(module[f])) {
                continue;
            }

            spyOn(module, f);
        }

        for(f in prototype) {
            if (typeof prototype[f] != 'function') {
                continue;
            }

            if (jasmine.isSpy(prototype[f])) {
                continue;
            }

            spyOn(prototype, f);
        }

        return module;
    };

    return new JasmineRain();
}()));


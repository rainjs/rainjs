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
         * References the modules loaded to jasmine
         *
         * @type {Array}
         */
        jasmine.loadedModules = [];

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
                require(modules, function () {
                   deps = Array.prototype.slice.call(arguments, 0);
                });
            });

           waitsFor(function () {
               return deps.length === modules.length;
           });

           runs(function () {
                for (var i = jasmine.loadedModules.length; i--;) {
                    var module = jasmine.loadedModules[i];
                    module = mock(module);
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


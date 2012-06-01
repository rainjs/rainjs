"use strict";

var fs = require('fs'),
    path = require('path'),
    vm = require('vm'),
    extend = require('node.extend');

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

        var file = path.join(process.cwd(), modpath);

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
            },
            deps
        );

        // Some more augmentation
        context.exports = context.module.exports;
        context.__dirname = path.dirname(context.__filename);

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

    /**
     * Mocks the object passed as parameter. All the methods are replaced with spies that return
     * undefined. The other properties are set to the values specified in props or undefined.
     *
     * @param {Object} obj the object to mock
     * @param {Object} props the value to use for the object's property values when mocking
     */
    JasmineRain.prototype.mock = function(obj, props) {
        var spec = jasmine.getEnv().currentSpec;

        //create the mocks array the first time mock is called for the current spec
        if (!spec.__mocks) {
            spec.__mocks = [];
        }

        var saveInitialValues = true;

        //if mock already executed for this object don't override the initial values
        if (!obj.__initialValues) {
            obj.__initialValues = {};
            spec.__mocks.push(obj);
        } else {
            saveInitialValues = false;
        }

        for (var key in obj) {
            if (key === '__initialValues') {
                continue;
            }
            if (typeof obj[key] === 'function') {
                spyOn(obj, key);
            } else {
                if (saveInitialValues) {
                    obj.__initialValues[key] = obj[key];
                }
                obj[key] = props ? props[key] : obj[key];
            }
        }
    };

    var oldFinish = jasmine.Spec.prototype.finish;

    //override the finish method to restore the mocked object to its initial state
    //spies are already restored by jasmine
    jasmine.Spec.prototype.finish = function (onComplete) {
        oldFinish.call(this, onComplete);

        if (this.__mocks) {
            for (var i = 0, len = this.__mocks.length; i < len; i++) {
                var obj = this.__mocks[i];
                for (var key in obj.__initialValues) {
                    obj[key] = obj.__initialValues[key];
                }
                delete obj.__initialValues;
            }
        }
    };

    return new JasmineRain();
}()));


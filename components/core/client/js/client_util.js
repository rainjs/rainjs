define(['core/jquery-cookie'], function () {

    /**
     * @class A singleton utility class
     * @constructor
     */
    function ClientUtil() {}

    /**
     * A reusable empty function for inheritance.
     *
     * @private
     * @memberOf ClientUtil#
     */
    function empty() {};

    /**
     * Returns a new object that links to a given prototype object.
     *
     * @param {Object} proto the prototype object to inherit from
     * @returns {Object} the object instance
     * @private
     * @memberOf ClientUtil#
     */
    function create(proto) {
        var F = empty;
        F.prototype = proto;
        return new F();
    }

    /**
     * Makes a function inherit from another's prototype.
     *
     * @param {Object} ctor the derived constructor function
     * @param {Object} superCtor the baes constructor function
     */
    ClientUtil.prototype.inherits = function (ctor, superCtor) {
        var __super__ = superCtor.prototype;
        ctor.prototype = create(__super__);
        ctor.prototype.constructor = ctor;
    }

    /**
     * Binds scope and arguments to a function.
     * All arguments passed after scope are considered bound.
     * Arguments passed to the binder function at call-time are also passed through at the
     * end of the parameter list, after the original bound parameters.
     *
     * @param {Function} f the function to which scope and/or arguments are bound
     * @param {Object} scope the scope to bind to the function
     * @returns {Function} the bound function
     * @throws {Error} illegal argument exception if f is not a function
     */
    ClientUtil.prototype.bind = function (f, scope) {
        if (typeof f !== 'function') {
            throw new Error('illegal argument exception: expected f to be a function');
        }

        var args = Array.prototype.slice.call(arguments, 2);

        return function () {
            for (var i = 0, l = arguments.length; i < l; i++) {
                args.push(arguments[i]);
            }

            return f.apply(scope, args);
        }
    };

    /**
     * Helper bind function for working with private methods.
     * Automatically binds the first parameter to be the scope too.
     *
     * @param {Function} f the function to which scope and/or arguments are bound
     * @param {Object} scope the scope to bind as the first parameter of the function
     * @returns {Function} the bound function
     * @see #bind
     */
    ClientUtil.prototype.bindPrivate = function (f, scope) {
        return bind(f, scope, scope);
    };

    /**
     * Decorate a function with advice.
     * Use {@link #bind} to bind the advice functions to the desired scope.
     *
     * @see #bind
     * @memberOf ClientUtil#
     * @param {Function} f the function to be decorated
     * @param {Object} advice holds advice functions
     * @param {Function} [advice.before] An advice (function) to insert before the actual call
     * @param {Function} [advice.after] An advice (function) to insert after the actual call
     * @param {Function} [advice.exception] An advice (function) to call in case of an
     * exception being thrown from the original function
     * @throws {Error} illegal argument exception if f is not a function
     * @throws {Error} illegal argument exception if any of the possible advices is not a function
     */
    ClientUtil.prototype.decorate = function (f, advice) {
        if (typeof f !== 'function') {
            throw new Error('illegal argument exception: expected f to be a function');
        }

        // A function to inject calls before and/or after the original function
        function wrap(before, after) {
            before && before();
            f();
            after && after();
        }

        // A function to catch exceptions thrown by the original function
        function guard(f, handle) {
            try {
                f();
            } catch (e) {
                handle(e);
            }
        }

        // No advice given ? Plainly return the original function
        if (!advice) {
            return f;
        }

        // Test each possible advice for correct type
        ['before', 'after', 'exception'].forEach(function (type) {
            if (advice[type] && typeof advice[type] !== 'function') {
                throw new Error('illegal argument exception: expected advice.' + type + ' to be a function');
            }
        });

        // Determine if the original function needs to be wrapped with before
        // and/or after advices
        var g = (advice.before || advice.after) ? bind(wrap, this, advice.before, advice.after)
                                                : f;

        // Determine if the wrapped/original function needs to be guarded
        // with exception advice
        return advice.exception ? bind(guard, this, g, advice.exception)
                                : g;
    };

    /**
     * Inject the properties from one object into another.
     * Useful for borrowing methods.
     *
     * @param {Object} on the object which borrows the properties
     * @param {Object} from the object which lends the properties
     */
    ClientUtil.prototype.inject = function (on, from) {
        for (var key in from) {
            if (from.hasOwnProperty(key)) {
                on[key] = from[key];
            }
        }

        return on;
    };

    /**
     * Returns the rain session id.
     *
     * @returns {String} the rain session id
     */
    ClientUtil.prototype.getSession = function () {
        return $.cookie('rain.sid');
    };

    /**
     * Defers the execution of a function until the first possible moment to run it.
     * Use {@link #bind} to bind scope and arguments to the function.
     *
     * @param {Function} f the function to defer
     */
    ClientUtil.prototype.defer = function (f) {
        setTimeout(f, 0);
    };

    /**
     * Internet explorer console wrapper
     */
    if (typeof console === "undefined" || typeof console.log === "undefined") {
      console = {
          log: function() {},
          info: function() {},
          error: function() {},
          warn: function() {}
      };
    }


    return new ClientUtil();
});


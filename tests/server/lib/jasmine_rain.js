"use strict";

var cwd = process.cwd();
//these paths should be relative in order to be able to require this file from sprint
require('../../../lib/globals');
var loadFile = require('../rain_mocker');

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
     *
     * @param {String} modulePath Path to the module related to the process cwd
     * @returns The module with access to all private variables and functions too.
     */
    JasmineRain.prototype.getModule = function(modulePath) {
        return loadFile(cwd + modulePath, null, true);
    };

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
                obj[key] = props ? props[key] : undefined;
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


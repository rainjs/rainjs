"use strict";

var fs = require('fs'),
    path = require('path'),
    vm = require('vm'),
    extend = require('node.extend');

/**
 * Cache for module code to avoid reading the file multiple times if the
 * the same module is requested more than once.
 *
 * @type {Object}
 */
var code = {};

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
 * Loads a module by sandboxing it and making all it's local scope available to the caller.
 * Mocking private functions for unit testing hasn't been easier.
 *
 * @param {String} file the module's file path
 * @param {Object} mocks an object containing properties with filename keys and
 * values that will be used in place of the original module's exports object
 * @param {Object} deps an object containing properties with variable names
 * and values that will be used for mocked dependencies injected into the loaded module
 * @returns {Object} the loaded module's context
 */
function sandboxModule(file, mocks, deps) {
    mocks = mocks || {};
    deps = deps || {};

    if (!code[file]) {
        // Use sync version because `require` is sync, so that's what the user expects
        code[file] = fs.readFileSync(file, 'utf8');
    }

    var context = vm.createContext(global);
    // Extend the context with provided mock dependencies and wrapped require
    extend(context, { require: sandboxRequire.bind(null, file, mocks) }, deps);
    // Run the module in the the created context
    vm.runInContext(code[file], context, file);

    return context;
};

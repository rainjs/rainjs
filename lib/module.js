"use strict";

var extend = require('node.extend');
var fs = require('fs');
var vm = require('vm');
var path = require('path');
var Module = require('module');

/**
 * Load a module that will run in a sandboxed context without any access to outside code
 *
 * @param {String} file the module to load
 * @param {Object} context the context that will be attached
 * @returns {Object} the exported module
 */
global.requireWithContext = function requireWithContext(file, context) {
    context = context || {};

    var filename = Module._resolveFilename(file, this);
    var cachedModule = Module._cache[filename];

    if (cachedModule) {
        return cachedModule.exports;
    }

    var mod = new Module(filename);
    Module._cache[filename] = mod;
    mod.filename = filename;
    mod.paths = Module._nodeModulePaths(path.dirname(filename));
    mod.extension = path.extname(filename) || '.js';

    var content = fs.readFileSync(filename, 'utf8');
    content = content.replace(/^\#\!.*/, ''); // strip shebang

    var sandbox = {};
    sandbox.__filename = filename;
    sandbox.__dirname = path.dirname(filename);
    sandbox.module = mod;
    sandbox.require= function (path) {
        return mod.require(path);
    };
    sandbox.global = {};
    extend(sandbox, global);
    extend(sandbox.global, context);

    // remove some stuff we don't want in the sandbox
    delete sandbox.process.exit;

    vm.runInNewContext(content, sandbox, filename, true);
    mod.loaded = true;

    return mod.exports;
};

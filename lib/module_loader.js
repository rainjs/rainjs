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

'use strict';

var fs = require('fs'),
    vm = require('vm'),
    path = require('path'),
    assert = require('assert'),
    Module = require('module'),
    logging = require('./logging'),
    Translation = require('./translation');

/**
 * Module loader for the server side code of RAIN components. Adds custom variables ``t``, ``nt``
 * and ``logger``.
 *
 * @name ModuleLoader
 * @constructor
 */
function ModuleLoader() {
    this._cache = {};
}

/**
 * Loads a module. ``t``, ``nt`` and ``logger`` are provided to this module.
 *
 * @param {String} filename absolute path for the module to be loaded
 * @param {Object} component the component to which the module belongs
 * @param {String} component.id the component id
 * @param {String} component.version the component version
 * @param {String} locale the locale to be used for ``t`` and ``nt``
 * @returns {Object} the exports object of the loaded module
 */
ModuleLoader.prototype.requireWithContext = function (filename, component, locale) {
    assert(filename[0] === '/' || (filename[1] === ':' && filename[2] === '\\'),
        'filename must be an absolute path');
    assert(path.extname(filename) === '.js', 'filename must have .js extension');

    var id = filename + ':' + component.id + ';' + component.version + ':' + locale,
        module = this._cache[id];

    if (!module) {
        module = new Module(filename);
        module.filename = filename;
        module.paths = Module._nodeModulePaths(path.dirname(filename));

        var script = this._compile(filename),
            customRequire = this._makeCustomRequire(module, component, locale),
            context = this._generateContext(component, locale);

        // The this keyword points to module.exports inside the module.
        // The first five parameters are the same with the ones provided by Node's module
        // system: exports, require, module, __filename, __dirname.
        script.call(module.exports,
            module.exports, customRequire, module, filename, path.dirname(filename),
            context.t, context.nt, context.logger);

        module.loaded = true;

        this._cache[id] = module;
    }

    return module.exports;
};

/**
 * Compiles the module to be loaded using the ``vm`` module.
 *
 * @param {String} filename the absolute file path for the module.
 * @returns {Function} the wrapper function
 */
ModuleLoader.prototype._compile = function (filename) {
    var content = fs.readFileSync(filename, 'utf8');

    // remove shebang
    content = content.replace(/^#!.*/, '');

    return vm.runInThisContext(this._wrap(content), filename);
};

/**
 * Wraps the module's code into an anonymous function.
 *
 * @param {String} content the content of the module
 * @returns {String}
 */
ModuleLoader.prototype._wrap = function (content) {
    return '(function (exports, require, module, __filename, __dirname, t, nt, logger) {\n' +
        content + '\n});';
};

/**
 * Constructs a custom require to be used by the loaded module. It uses this custom module loader
 * to load sub-modules belonging to the same component. Node's require is used for core modules,
 * modules located in ``node_modules`` folder and modules with another extension than ``.js``.
 *
 * @param {Module} module the module from where the sub-module is requested.
 * @param {Object} component
 * @param {String} locale
 * @returns {Object} the exports object of the loaded module
 * @private
 */
ModuleLoader.prototype._makeCustomRequire = function (module, component, locale) {
    var dirname = path.dirname(module.filename),
        self = this;

    return function (request) {
        if (request.indexOf('./') === 0 || request.indexOf('../') === 0) {
            var modulePath = path.resolve(dirname, request);

            if (path.extname(modulePath) === '') {
                modulePath += '.js';
            }

            if (path.extname(modulePath) === '.js' && fs.existsSync(modulePath)) {
                return self.requireWithContext(modulePath, component, locale);
            }
        }

        return module.require(request);
    };
};

/**
 * Creates an object containing ``t``, ``nt`` and ``logger``.
 *
 * @param {Object} component the component descriptor
 * @param {String} locale the locale
 * @returns {Object}
 */
ModuleLoader.prototype._generateContext = function (component, locale) {
    var context = Translation.get().generateContext(component, locale);
    context.logger = logging.get(component);
    return context;
};

/**
 * Singleton instance.
 *
 * @type {ModuleLoader}
 * @private
 */
ModuleLoader._instance = null;

/**
 * Gets the singleton instance.
 *
 * @returns {ModuleLoader}
 */
ModuleLoader.get = function () {
    if (!ModuleLoader._instance) {
        ModuleLoader._instance = new ModuleLoader();
    }

    return ModuleLoader._instance;
};

module.exports = ModuleLoader;

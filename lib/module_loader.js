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

var extend = require('node.extend'),
    fs = require('fs'),
    vm = require('vm'),
    path = require('path'),
    util = require('util'),
    Module = require('module'),
    logging = require('./logging'),
    Translation = require('./translation');

/**
 * Module loader for the server side code of RAIN components. Adds custom properties to the
 * module context. This class is a singleton.
 *
 * @name ModuleLoader
 * @constructor
 */
function ModuleLoader() {
    this._scriptCache = {};
    this._moduleCache = {};
}

/**
 * Load a module that will run in a new context to which ``t``, ``nt`` and ``logger``
 * properties are added.
 *
 * @param {String} modulePath absolute path for the module to be loaded
 * @param {Object} component the component for which to generate the context
 * @param {String} language the language for which to generate the context
 * @returns {Object} the exported module
 */
ModuleLoader.prototype.requireWithContext = function (modulePath, component, language) {
    var moduleId =  this._getModuleId(modulePath, component, language),
    //   module = this._moduleCache[moduleId];

    //if (!module) {
        module = this._createModule(modulePath, component, language);
    //    this._moduleCache[moduleId] = module;
    //}

    return module.exports;
};

/**
 * Creates a module for the specified context.
 *
 * @param {String} modulePath absolute path for the module to be loaded
 * @param {Object} component the component for which to generate the context
 * @param {String} language the language for which to generate the context
 * @returns {Module}
 */
ModuleLoader.prototype._createModule = function (modulePath, component, language) {
    var script = this._scriptCache[modulePath];

    if (!script) {
        script = this._createScript(modulePath);
        this._scriptCache[modulePath] = script;
    }

    var context = this._generateContext(component, language);

    var module = new Module(modulePath);
    module.filename = modulePath;
    module.paths = Module._nodeModulePaths(path.dirname(modulePath));
    module.extension = path.extname(modulePath) || '.js';


    var sandbox = {};
    sandbox.__filename = modulePath;
    sandbox.__dirname = path.dirname(modulePath);
    sandbox.module = module;
    sandbox.exports = module.exports;
    sandbox.require = module.require.bind(module);
    sandbox.global = {};
    extend(sandbox, global);
    extend(sandbox.global, context);
    extend(sandbox, context);
    script.runInNewContext(sandbox);
    module.loaded = true;

    return module;
};

/**
 * Generates an unique id for the path, component and language combination.
 *
 * @param {String} modulePath module path
 * @param {Object} component the component descriptor
 * @param {String} language the current language
 * @returns {String}
 */
ModuleLoader.prototype._getModuleId = function (modulePath, component, language) {
    var componentId = (component && component.id) || '',
        componentVersion = (component && component.version) || '';

    return util.format('%s##%s;%s##%s', modulePath, componentId, componentVersion, language);
};

/**
 * Reads the specified file and creates a new ``Script`` object using the ``vm`` module
 *
 * @param {String} modulePath the path of the module
 * @returns {Script}
 */
ModuleLoader.prototype._createScript = function (modulePath) {
    var content = fs.readFileSync(modulePath, 'utf8');
    content = content.replace(/^#!.*/, ''); // strip shebang
    return vm.createScript(content, modulePath);
};

/**
 * Creates an object that will be injected in the module context.
 *
 * @param {Object} component the component descriptor
 * @param {String} language the language
 * @returns {Object}
 */
ModuleLoader.prototype._generateContext = function (component, language) {
    var context = Translation.get().generateContext(component, language);
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

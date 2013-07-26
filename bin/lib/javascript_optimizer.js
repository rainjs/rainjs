// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of
// conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
// 3. Neither the name of The author nor the names of its contributors may be used to endorse or
// promote products derived from this software without specific prior written permission.
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

var requirejs = require('requirejs'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    path = require('path'),
    util = require('../../lib/util'),
    fs = require('fs'),
    wrench = require('wrench'),
    extend = require('node.extend');

var excludedModules = ['js/index.min'];
var excludedCoreModules = [
    'raintime/index.min',
    'raintime/lib/es5-shim.min',
    'raintime/lib/jquery_plugins',
    'raintime/lib/require-jquery'
];


/**
 * Minifies the client-side JavaScript code for the specified components.
 *
 * @param {Object} options the minification options
 * @param {Object} options.components contains the components to be minified and the additional components
 * @param {Array} options.includedComponents list of components to be minified
 * @param {String} options.[outputPath] the path to create the minified project
 * @constructor
 */
function JsOptimizer(options) {
    this._components = options.components;
    this._includedComponents = options.includedComponents;
    this._outputPath = options.outputPath;

    this._baseConfig = {
        optimize: "uglify2",
        uglify2: {
            mangle: true
        },
        preserveLicenseComments: false
    };
}

/**
 * Performs the minification.
 */
JsOptimizer.prototype.run = function () {
    for (var i = 0, len = this._includedComponents.length; i < len; i++) {
        var component = this._components[this._includedComponents[i]],
            output;

        if (this._outputPath) {
            this._copyExcludedFiles(component);
            this._modifyMetaJson(component);
            output = path.join(this._outputPath, 'components', component.folder,
                'client', 'js', 'index.min.js');
        } else {
            output = path.join(component.path, 'client', 'js', 'index.min.js');
        }

        var options = component.id === 'core' ?
            this._generateCoreConfiguration(component, output) :
            this._generateConfiguration(component, output);

        (function (component) {
            requirejs.optimize(options, function () {
                console.log('js ok', component.id, component.version);
            }, function (err) {
                console.log('error: ', component.id, component.version, err.message);
            });
        })(component);
    }
};

/**
 * Explicitly specifies the client-side controllers in the meta.json file. Since the files will
 * not be present in the minified project, the runtime will fail to autodiscover the client-side
 * controller.
 *
 * @param {Object} component the component for which to modify the meta.json
 * @private
 */
JsOptimizer.prototype._modifyMetaJson = function (component) {
    var config = component.config,
        configPath = path.join(this._outputPath, 'components', component.folder, 'meta.json');

    for (var viewName in config.views) {
        var view = config.views[viewName],
            hasController = view.controller && view.controller.client,
            controllerPath = path.join(component.path, 'client', 'js', viewName + '.js');

        if (!hasController && fs.existsSync(controllerPath)) {
            view.controller = view.controller || {};
            view.controller.client = viewName + '.js';
        }
    }

    fs.writeFileSync(configPath, JSON.stringify(config), 'utf8');
};

/**
 * Generates the RequireJS optimizer configuration for a regular component.
 *
 * @param {Object} component
 * @param {String} outputFile the path where the minified file will be written
 * @returns {Object} the optimizer configuration
 * @private
 */
JsOptimizer.prototype._generateConfiguration = function (component, outputFile) {
    var self = this;
    var componentPath = component.path;
    var coreLocation = path.join(this._components['core;1.0'].path, 'client', 'js');

    return  extend(true, {}, this._baseConfig, {
        baseUrl: path.join(componentPath, 'client'),
        packages: [{
            name: 'raintime',
            main: 'raintime',
            location: coreLocation
        }, {
            name: component.id + '/' + component.version,
            main: 'js/index',
            location : '.'
        }],

        // t, nt and logger are excluded, but requirejs optimizer still needs to resolve them
        map: {
            '*': {
                't': 'raintime',
                'nt': 'raintime',
                'logger': 'raintime'
            }
        },

        include: this._getModules(componentPath, 'js', excludedModules),
        exclude: ['raintime'],
        excludeShallow: ['t', 'nt', 'logger'],
        out: outputFile,

        wrap: {
            end: util.format("define('%s/%s/js/index.min', [], function () {});",
                component.id, component.version)
        },

        onBuildRead: function (moduleName, path, contents) {
            return self._onBuildRead(this, component, moduleName, path, contents);
        },
        onBuildWrite: function (moduleName, path, contents) {
            return self._onBuildWrite(this, component, moduleName, path, contents);
        }
    });
};

/**
 * Generates the RequireJS optimizer configuration for the core component.
 *
 * @param {Object} component
 * @param {String} outputFile the path where the minified file will be written
 * @returns {Object} the optimizer configuration
 * @private
 */
JsOptimizer.prototype._generateCoreConfiguration = function (component, outputFile) {
    var componentPath = component.path;

    return extend(true, {}, this._baseConfig, {
        baseUrl: path.join(componentPath, 'client', 'js'),

        paths: {
            'text': 'lib/require-text',
            'locale': 'lib/require-locale'
        },

        packages: [{
            name: 'raintime',
            main: 'raintime',
            location: '.'
        }],

        include: this._getModules(componentPath, 'raintime', excludedCoreModules),
        out: outputFile,

        wrap: {
            end: "define('raintime/index.min', [], function () {});" +
                "define('locale', ['raintime/lib/require-locale'], " +
                "function (locale) { return locale; });"
        }
    });
};

/**
 * Callback to be used for the onBuildRead option of RequireJS optimizer.
 *
 * @param {Object} config the RequireJS optimizer configuration
 * @param {Object} component the current component
 * @param {String} moduleName current module name
 * @param {String} modulePath current module path
 * @param {String} contents current module contents
 * @returns {String} the modified module contents
 * @private
 */
JsOptimizer.prototype._onBuildRead = function (config, component, moduleName, modulePath, contents) {
    var self = this;

    if (moduleName.indexOf(component.id + '/' + component.version) === 0) {
        config.excludeShallow.push(moduleName);
        return contents;
    }

    var ast;

    try {
        ast = esprima.parse(contents);
    } catch(e) {
        throw new RainError('Error while parsing ' + moduleName + '. ' + e.message);
    }

    var defineStatement = this._getDefineStatement(ast);

    if (typeof defineStatement === 'undefined') { // global module
        contents += '\n\n';
        contents += util.format('define("%s", function(){});', moduleName);
        contents += '\n\n';
    } else {
        var deps = this._getDependencies(defineStatement);

        deps.filter(function (dep) {
            return dep.indexOf('js/') !== 0 &&
                dep.indexOf('raintime/') !== 0 &&
                dep.indexOf(component.id + '/' + component.version + '/') !== 0 &&
                ['t', 'nt', 'logger'].indexOf(dep) === -1;
        }).forEach(function (dep) {
            var parts = dep.split('/');
            var externalComponent = self._components[parts[0] + ';' + parts[1]];

            if (!externalComponent) {
                throw new Error(util.format('The component %s;%s does not exist',
                    parts[0], parts[1]));
            }

            var packageName = parts[0] + '/' + parts[1];

            if (!config.pkgs || config.pkgs[packageName]) {
                return;
            }

            var packageObj = {
                name: packageName,
                main: 'js/index',
                location: path.join(externalComponent.path, 'client')
            };

            config.packages.push(packageObj);
            config.pkgs[packageName] = packageObj;
            config.excludeShallow.push(dep);
        });
    }

    return contents;
};

/**
 * Callback to be used for the onBuildWrite option of RequireJS optimizer.
 *
 * @param {Object} config the RequireJS optimizer configuration.
 * @param {Object} component the current component
 * @param {String} moduleName current module name
 * @param {String} path current module path
 * @param {String} contents current module contents
 * @returns {String} the modified module contents
 * @private
 */
JsOptimizer.prototype._onBuildWrite = function (config, component, moduleName, path, contents) {
    var ast = esprima.parse(contents),
        defineStatement = this._getDefineStatement(ast),
        newName = util.format('%s/%s/%s', component.id, component.version, moduleName);

    defineStatement.expression.arguments[0].value = newName;

    return escodegen.generate(ast);
};

/**
 * Get the modules for the specified component.
 *
 * @param {String} componentPath the component path
 * @param {String} modulePrefix the prefix to be used when composing the module name
 * @param {Array} excludedModules the modules to be excluded
 * @returns {Array} the found modules
 * @private
 */
JsOptimizer.prototype._getModules = function (componentPath, modulePrefix, excludedModules) {
    var jsPath = path.join(componentPath, 'client', 'js'),
        modules = [];

    util.walkSync(jsPath, ['.js'], function (filePath) {
        var moduleName = filePath.substring(jsPath.length + 1, filePath.length - 3);


        if (modulePrefix !== 'raintime' || moduleName !== 'raintime') {
            moduleName = modulePrefix + '/' + moduleName.replace(/\\/g, '/');
        }

        if (excludedModules.indexOf(moduleName) === -1) {
            modules.push(moduleName);
        }
    });

    return modules;
};

/**
 * Copies the files that were excluded from minification to the minified project.
 *
 * @param {Object} component
 * @private
 */
JsOptimizer.prototype._copyExcludedFiles = function (component) {
    var jsPath = path.join(component.path, 'client', 'js'),
        prefix = component.id === 'core' ? 'raintime' : 'js',
        excluded = component.id === 'core' ? excludedCoreModules : excludedModules,
        output = path.join(this._outputPath, 'components', component.folder, 'client', 'js');

    util.walkSync(jsPath, ['.js'], function (filePath) {
        var moduleName = filePath.substring(jsPath.length + 1, filePath.length - 3),
            destination = path.join(output, path.relative(jsPath, filePath));
        moduleName = prefix + '/' + moduleName.replace('\\', '/');

        if (excluded.indexOf(moduleName) !== -1) {
            wrench.mkdirSyncRecursive(path.dirname(destination));
            fs.writeFileSync(destination, fs.readFileSync(filePath));
        }
    });
};

/**
 * Locates the define statement in the specified AST.
 *
 * @param {Object} ast the abstract syntax tree from which to extract the define statement
 * @returns {Object} the define statement
 * @private
 */
JsOptimizer.prototype._getDefineStatement = function (ast) {
    for (var i = 0, len = ast.body.length; i < len; i++) {
        var statement = ast.body[i];

        if (statement.type === 'ExpressionStatement' &&
            statement.expression.type === 'CallExpression' &&
            statement.expression.callee.name === 'define') {
            return statement;
        }
    }
};

/**
 * Extracts the dependencies from a define statement.
 *
 * @param {Object} defineStatement the ast for the define statement
 * @returns {Array} the list of dependencies
 * @private
 */
JsOptimizer.prototype._getDependencies = function (defineStatement) {
    var args = defineStatement.expression.arguments,
        depsArg,
        deps = [];

    if (args.length === 3) {
        depsArg = args[1];
    }

    if (args.length === 2) {
        depsArg = args[0];
    }

    if (!depsArg || depsArg.type !== 'ArrayExpression') {
        return [];
    }

    for (var i = 0, len = depsArg.elements.length; i < len; i++) {
        var dep = depsArg.elements[i];
        if (dep.type === 'Literal') {
            deps.push(dep.value);
        }
    }

    return deps;
};

module.exports = JsOptimizer;

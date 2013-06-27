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

var path = require('path'),
    fs = require('fs'),
    sdkUtils = require('../lib/utils'),
    util = require('../../lib/util'),
    requirejs = require('requirejs'),
    less = require('less'),
    async = require('async');

/**
 * Register the generate localization files command.
 *
 * @param {Program} program
 */
function register(program) {
    program
        .command('minify')
        .description('Minifies js files')
        .action(minify);
}

/**
 *
 */
function minify() {
    var projectRoot = sdkUtils.getProjectRoot(process.cwd()),
        componentsFolder = path.join(projectRoot, 'components'),
        folders = fs.readdirSync(componentsFolder);

    for (var i = 0, len = folders.length; i < len; i++) {
        var componentPath = path.join(componentsFolder, folders[i]);
        if (!fs.statSync(componentPath).isDirectory()) {
            continue;
        }

        try {
            var metaFile = path.join(componentPath, 'meta.json');
            var config = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
            var options;
            var excludedCoreFiles = [
                'index.min.js',
                'logger.js',
                'context.js',
                'raintime.js',
                'async_controller.js',
                'client_storage.js',
                'lib/es5-shim.min.js',
                'lib/jquery_plugins.js',
                'lib/require-jquery.js'
            ];
            var jsPath = path.join(componentPath, 'client/js/');

            // minify JavaScript
            if (config.id === 'core') {
                options = {
                    baseUrl: path.join(componentPath, 'client/js'),

                    "paths": {
                        "text": "lib/require-text"
                    },

                    optimize: "uglify2",
                    uglify2: {
                        mangle: false
                    },

                    "packages": [{
                        "name": "raintime",
                        "main": "raintime",
                        "location": "."
                    }],

                    include: [],
                    out: path.join(componentPath, 'client/js/index.min.js'),

                    wrap: {
                        end: "define('raintime/index.min', [], function () {});"
                    }
                };

                util.walkSync(jsPath, ['.js'], function(filePath) {
                    var file = filePath.match(/core\/client\/js\/(.*)/)[1];

                    if (excludedCoreFiles.indexOf(file) === -1) {
                        options.include.push('raintime/' + file.slice(0, -3));
                    };

                });

            } else {
                options = {
                    baseUrl: path.join(componentPath, 'client'),
                    optimize: "uglify2",
                    uglify2: {
                        mangle: false
                    },

                    "packages": [{
                        "name": "raintime",
                        "main": "raintime",
                        "location": "../../core/client/js"
                    }],

                    include: [],
                    exclude: ["raintime"],
                    out: path.join(componentPath, 'client/js/index.min.js'),

                    wrap: {
                        end: util.format("define('%s/%s/js/index.min', [], function () {});",
                            config.id, config.version)
                    },

                    onBuildRead: function (moduleName, path, contents) {
                        // global modules
                        if (contents.indexOf('define(') === -1) {
                            contents += '\n\n';
                            contents += util.format('define("%s", function(){});', moduleName);
                            contents += '\n\n';
                        }

                        return contents;
                    },

                    onBuildWrite: (function (config) {
                        return function (moduleName, path, contents) {
                            return contents.replace(moduleName,
                                util.format('%s/%s/%s', config.id, config.version, moduleName));
                        }
                    })(config)
                };

                Object.keys(config.views).forEach(function (viewName) {
                    var view  = config.views[viewName];

                    if (view.controller && view.controller.client) {
                        options.include.push('js/' + path.basename(view.controller.client, '.js'));
                    } else {
                        if(fs.existsSync(path.join(componentPath, 'client/js', viewName + '.js'))) {
                            options.include.push('js/' + viewName);
                        }
                    }
                });
            }

            requirejs.optimize(options, (function (config) {
                console.log('js ok', config.id, config.version);
            }).bind(null, config));

            // minify CSS
            var cssFolder = path.join(componentPath, 'client/css'),
                options = {compress: true, yuicompress: true},
                minifiedCss = '',
                files = [];

            util.walkSync(cssFolder, ['.css'], function(filePath) {
                if (filePath.indexOf('index.min.css') === -1)
                files.push(filePath);
            });

            async.map(files, function (filePath, callback) {
                var css = fs.readFileSync(filePath, 'utf8');
                less.render(css, options, callback);
            }, (function (config, cssFolder, err, results) {
                fs.writeFileSync(path.join(cssFolder, 'index.min.css'), results.join('\n'), 'utf8');
                console.log('css ok', config.id, config.version);
            }).bind(null, config, cssFolder));
        } catch (ex) {
            console.log('Failed to minify files in ' + componentPath + ' folder!\n' + ex.stack);
        }
    }
}

module.exports = register;

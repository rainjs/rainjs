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

var path = require('path'),
    sdkUtils = require('../lib/utils'),
    JavaScriptOptimizer = require('../lib/javascript_optimizer');

/**
 * Registers the minify command.
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
 * Performs minification for the current RAIN project.
 */
function minify() {
    var projectRoot = sdkUtils.getProjectRoot(process.cwd()),
        componentsFolder = path.join(projectRoot, 'components'),
        components = {},
        includedComponents = [];

    sdkUtils.iterateComponents(componentsFolder, function (config, path, folder) {
        var fullId = config.id + ';' + config.version;
        includedComponents.push(fullId);
        components[fullId] = {
            id: config.id,
            version: config.version,
            path: path,
            folder: folder,
            config: config
        };
    });

    try {
        var buildConfig = require(path.join(projectRoot, 'build.json')),
            additionalProjects = buildConfig.additionalProjects || [];

        for (var i = 0, len = additionalProjects.length; i < len; i++) {
            var folder = path.resolve(projectRoot, additionalProjects[i], 'components');

            sdkUtils.iterateComponents(folder, function (config, path, folder) {
                components[config.id + ';' + config.version] = {
                    id: config.id,
                    version: config.version,
                    path: path,
                    folder: folder,
                    config: config
                };
            });
        }
    } catch (ex) {
        // the build configuration doesn't exists
    }

    var optimizer = new JavaScriptOptimizer({
        out: '/path/to/the/minified/project', // defaults to the current project
        components: components,
        includedComponents: includedComponents
    });
    optimizer.run();
}

module.exports = register;

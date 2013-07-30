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
    fs = require('fs'),
    wrench = require('wrench'),
    sdkUtils = require('../lib/utils'),
    util = require('../../lib/util'),
    JavaScriptOptimizer = require('../lib/javascript_optimizer'),
    CssOptimizer = require('../lib/css_optimizer');

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
 * Performs minification for the current RAIN project. Options are specified in the ``build.json``
 * file located in the project root.
 *
 * The options that can be specified are:
 *
 * - ``additionalProjects``: array of project paths containing components on which the current
 *   project depends
 * - ``buildPath``: if this option is specified a new project containing the minified files
 *   will be created at this location. By default, the minified files are placed in the
 *   component folder.
 */
function minify() {

    var projectRoot = sdkUtils.getProjectRoot(process.cwd()),
        componentsFolder = path.join(projectRoot, 'components'),
        components = {},
        includedComponents = [],
        outputPath;

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

        if (buildConfig.buildPath) {
            outputPath = path.resolve(projectRoot, buildConfig.buildPath);
            copyProject(projectRoot, outputPath);
        }

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
        console.log(ex.stack);
        // the build configuration doesn't exists
    }

    if(buildConfig.javascriptMinification) {
        var optimizer = new JavaScriptOptimizer({
            outputPath: outputPath,
            components: components,
            includedComponents: includedComponents
        });
        optimizer.run();
    }

    if(buildConfig.cssMinification) {
        var optimizer = new CssOptimizer({
            outputPath: outputPath,
            themes: buildConfig.themes,
            components: components,
            includedComponents: includedComponents
        });
        optimizer.run();
    }
}

/**
 * Copies a RAIN project. Javascript files and or folders created by the source code repositories
 * are not copied
 * @param {String} projectPath the project to be copied
 * @param {String} minPath the destination directory
 */
function copyProject(projectPath, minPath) {
    wrench.mkdirSyncRecursive(minPath, '0755');

    var files = fs.readdirSync(projectPath);

    for (var i = 0, len = files.length; i < len; i++) {
        var file = files[i],
            fromPath = path.join(projectPath, file),
            toPath = path.join(minPath, file),
            stats = fs.lstatSync(fromPath);

        if (['.git', '.svn', '.cvs'].indexOf(file) !== -1) {
            continue;
        }

        if (stats.isSymbolicLink()) {
            continue;
        }

        if (stats.isDirectory() && fromPath.match(/^.*\/client\/js$|^.*\\client\\js$/)) {
            wrench.mkdirSyncRecursive(toPath, '0755');
            continue;
        }

        if (stats.isDirectory()) {
            wrench.mkdirSyncRecursive(toPath, '0755');
            copyProject(fromPath, toPath);
        } else {
            fs.writeFileSync(toPath, fs.readFileSync(fromPath));
        }


    }
}

module.exports = register;

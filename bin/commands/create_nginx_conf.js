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
    color = require('colors'),
    util = require('../../lib/util'),
    NginxGenerator = require('../lib/nginx_generator'),
    utils = require('../lib/utils');

/**
 * Register the create component command.
 *
 * @param {Program} program
 */
function register(program) {
    program
        .command('generate-nginx-conf')
        .description('Generate the nginx configuration file')
        .action(generateNginxConfiguration);
}

/**
 * Generate Nginx configuration method, reads the build.json for additional projects,
 * production paths and paths for the source configuration and generated configuration file so it
 * can create a full project nginx configuration. It is mandatory for the production paths
 * to be absolute paths.
 *
 * Example:
 *
 * build.json content:
 * {
 *   "productionPath": "/opt/ui/opt/rainjs-ssa/",
 *   "additionalProjects": ["../rainjs"],
 *   "additionalProjectsProductionPaths": ["/opt/ui/lib/node_modules/rain/"],
 *   "nginxConfig": {
 *       "sourcePath": "./conf/nginx.conf",
 *       "destinationPath": "./nginx.conf"
 *   }
 * }
 */
function generateNginxConfiguration() {
    var projects = [],
        projectRoot = utils.getProjectRoot(process.cwd()),
        defaultConfiguration = require(path.join(projectRoot, 'build.json')),
        productionPath = defaultConfiguration.productionPath,
        sourcePath,
        destPath;

    projects.push({
        'path': projectRoot,
        'productionPath': productionPath,
        'componentFolders': defaultConfiguration.componentFolders || ["./components"]
    });

    if(defaultConfiguration.additionalProjects) {
        var additionalProjectProdPath;

        defaultConfiguration.additionalProjects.forEach(function (folder, index) {
            if(productionPath && defaultConfiguration.additionalProjectsProductionPaths) {
                additionalProjectProdPath =
                    defaultConfiguration.additionalProjectsProductionPaths[index];
            }

            var resolvedFolder = path.resolve(process.cwd(), folder);

            var conf = require(path.join(resolvedFolder, '/build.json'));

            projects.push({
                'path': path.resolve(process.cwd(), folder),
                'productionPath':  productionPath ? additionalProjectProdPath : undefined,
                'componentFolders': conf.componentFolders || ["./components"]
            });
        });
    }

    try {
        var nginxConf;

        if (defaultConfiguration.nginxConfig && defaultConfiguration.nginxConfig.sourcePath) {
            sourcePath =  path.resolve(process.cwd(), defaultConfiguration.nginxConfig.sourcePath);
        } else {
            sourcePath = path.resolve(__dirname, '../conf/nginx.conf');
        }

        nginxConf = fs.readFileSync(sourcePath);

        if (defaultConfiguration.nginxConfig && defaultConfiguration.nginxConfig.destinationPath) {
            destPath = path.resolve(process.cwd(), defaultConfiguration.nginxConfig.destinationPath);
        }  else {
            destPath =  path.resolve(process.cwd(), 'nginx.conf');
        }

        nginxConf = JSON.parse(nginxConf);
    } catch (e) {
        console.log('Error reading source file.');
        console.log(e.message.red);
        console.log(e.stack.red);
        process.exit(1);
    }

    var generator = new NginxGenerator({
        projects: projects,
        nginxConf: nginxConf,
        destinationPath: destPath
    });

    generator.run();
}

module.exports = register;

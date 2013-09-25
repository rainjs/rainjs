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
        .command('generate-nginx-conf [source-file] [destination-file] [production-path]')
        .description('Generate the nginx configuration file')
        .action(generateNginxConfiguration);
}

/**
 * Generate Nginx configuration method, reads the build.json for additional projects, so it
 * can generate a full project nginx configuration.
 *
 *  @param {String} [sourcePath] custom nginx configuration file path, if not specified
 *  the default ``bin/conf/nginx.conf`` will be used
 *  it can be a relative or absolute path:
 *  ``bin/conf/customNginx.conf`` or  ``/home/john/rainjs/bin/conf/customNginx.conf``
 *
 *  @param {String} [destinationPath] computed configuration file path, if not specified
 *  the default ``nginx.conf`` will be used
 *  it can be a relative or absolute path
 *
 *  @param {String} [productionPath] path of the project folder in production environment.
 *  The paths of the additional projects will be calculated according to this path.
 *  It is mandatory for this to be an absolute path.
 *  Example: ``/opt/rainProject``
 */
function generateNginxConfiguration(sourcePath, destinationPath, productionPath) {
    var projects = [],
        projectRoot = utils.getProjectRoot(process.cwd()),
        defaultConfiguration = require(path.join(projectRoot, 'build.json'));

    projects.push({
        'path': projectRoot,
        'productionPath': productionPath
    });

    if(defaultConfiguration.additionalProjects) {
        var prodPathsIndex = 0; //if production paths have been provided this will help traversing the array
        var additionalProjectPath; //store production path for current additional project

        defaultConfiguration.additionalProjects.forEach(function (folder) {

            if(defaultConfiguration.additionalProjectsProductionPaths) {
                additionalProjectPath =  defaultConfiguration.additionalProjectsProductionPaths[prodPathsIndex];
                prodPathsIndex += 1;
            }

            projects.push({
                'path': path.resolve(process.cwd(), folder),
                'productionPath':  additionalProjectPath
            });
        });
    }

    try {
        var nginxConf;
        var destPath;

        if (sourcePath) {
            var resolvedPath =   path.resolve(process.cwd(), sourcePath);
            nginxConf = fs.readFileSync(resolvedPath);
        } else {
            nginxConf = fs.readFileSync(path.join(__dirname, '../conf/nginx.conf'));
        }

        if (destinationPath) {
            destPath = path.resolve(process.cwd(), destinationPath);
        }

        nginxConf = JSON.parse(nginxConf);
    } catch (e) {
        console.log('Error when resolving paths.');
        console.log(e.message.red);
        console.log(e.stack.red);
        process.exit(1);
    }

    var generator = new NginxGenerator({
        projects: projects,
        nginxConf: nginxConf,
        destinationPath: destPath || 'nginx.conf'
    });

    generator.run();
}

module.exports = register;

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
    wrench = require('wrench'),
    color = require('colors'),
    component = require('../lib/component'),
    utils = require('../lib/utils');

/**
 * Registers the create project command.
 *
 * @param {Program} program
 */
function register(program) {
    program
        .command('create-project <project-name> [path]')
        .description('Create a new RAIN project.')
        .action(createProject);
}

/**
 * Creates a new RAIN project.
 *
 * @param {String} projectName the project name
 * @param {String} [projectPath] the project path
 */
function createProject(projectName, projectPath, options) {
    projectPath = projectPath || '.';
    projectPath = path.join(path.resolve(projectPath), projectName);

    try {
        // getProjectRoot throws an exception when no project is found
        var root = utils.getProjectRoot(projectPath);

        // if a project exists warn the user and exit
        console.log('Directory %s is already part of a project located here: %s!',
            projectPath.blue, root.blue);
        process.exit(1);
    } catch (err) {}

    if (path.existsSync(projectPath)) {
        console.log('The file or directory %s already exists!', projectPath.blue);
        process.exit(1);
    }

    try {
        setupProject(projectPath);
        component.create(projectPath, 'hello_world', '1.0');

        if (options.parent.verbose) {

        console.log([
            'Project created.'.green,
            '',
            'Go to the root directory of the project and start the server.',
            ('  $ cd ' + projectPath + ' && raind').green,
            '',
            'Open ' + 'http://localhost:1337/hello_world/index'.blue + ' to see the default component.'
            ].join('\n'));
        }
    } catch (err) {
       console.log('Failed to setup project:', err.message);
       try {
           fs.unlinkSync(projectPath);
       } catch (e) {
           // nothing else we can do
       }
       process.exit(1);
    }
}

/**
 * Create the project folder structure.
 *
 * @param {String} projectPath the project path
 * @throws {Error} if it cannot create the project structure
 */
function setupProject(projectPath) {
    var permissions = '0755';
    var paths = {
        components: path.join(projectPath, 'components'),
        conf: path.join(projectPath, 'conf'),
        log: path.join(projectPath, 'log')
    };

    // Create project directory.
    wrench.mkdirSyncRecursive(projectPath, permissions);

    // Create components, conf and log directories.
    fs.mkdirSync(paths.components, permissions);
    fs.mkdirSync(paths.conf, permissions);
    fs.mkdirSync(paths.log, permissions);

    // Copy default configurations.
    wrench.copyDirSyncRecursive(
        path.resolve(path.join(__dirname, '../init/conf')),
        paths.conf
    );

    // Create a package.json file for the project.
    var projectName = path.basename(projectPath);
    var json = {
        name: projectName,
        version: '0.0.1',
        dependencies: [],
        keywords: [projectName]
    };
    json = JSON.stringify(json, null, 4) + '\n';
    fs.writeFileSync(path.join(projectPath, 'package.json'), json);

    // Mark the folder as a RAIN project by writing a ghost file.
    fs.writeFileSync(path.join(projectPath, '.rain'), '');
}

module.exports = register;

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
    utils = require('../lib/utils');

/**
 * Register the create project command.
 *
 * @param {Program} program
 */
function register(program) {
    program
        .command('create-project <path> <project-name>')
        .description('Create a new RAIN project.')
        .action(createProject);
}

/**
 * Creates a new RAIN project.
 *
 * @param {String} projectPath the project path
 * @param {String} projectName the project name
 */
function createProject(projectPath, projectName) {
    projectPath = path.join(path.resolve(projectPath), projectName);

    try {
        var root = utils.getProjectRoot(projectPath);
        utils.log('Directory ' + projectPath.blue + ' is already part of a project located here: "'
                               + root + '"!');
        return utils.destroyStdin();
    } catch (err) {}

    if (path.existsSync(projectPath)) {
        if (!fs.statSync(projectPath).isDirectory()) {
            utils.log('Invalid location: ' + projectPath.blue + ' is not a directory!');
            return utils.destroyStdin();
        }
        utils.log('Directory ' + projectPath.blue + ' already exists!');
        return utils.destroyStdin();
    }

    try {
        setupProject(projectPath);
        utils.setupComponent(projectPath, 'hello_world', '1.0');
        utils.log(
            'Project created'.green,
            '',
            'Go to the root directory of the project and start the server.',
            '  $ ' + ('cd ' + projectPath + ' | rain start').green,
            '',
            'Open ' + 'http://localhost:1337/hello_world/index'.blue
                    + ' to see the default component.',
            ''
        );
    } catch (err) {
        utils.log('An error occurred during project setup!'.red, err);
    }

    utils.destroyStdin();
}

/**
 * Create the project folder structure.
 *
 * @param {String} projectPath the project path
 */
function setupProject(projectPath) {
    var paths = {
        conf: path.join(projectPath, 'conf'),
        components: path.join(projectPath, 'components'),
        'public': path.join(projectPath, 'public'),
        log: path.join(projectPath, 'log')
    };

    // Create project directory.
    fs.mkdirSync(projectPath, '0755');

    // Create components directory.
    fs.mkdirSync(paths.components, '0755');

    // Create conf directory.
    fs.mkdirSync(paths.conf, '0755');

    // Create log directory.
    fs.mkdirSync(paths.log, '0755');

    // Copy default configurations.
    wrench.copyDirSyncRecursive(
        path.resolve(path.join(__dirname, '../init/conf')),
        paths.conf
    );

    // Create a package.json file for the project.
    var projectName = projectPath.split('/').splice(-1);
    var json = [
        '{',
        '    "name": "' + projectName + '",',
        '    "version": "0.0.1",',
        '    "dependencies": [],',
        '    "keywords": ["' + projectName + '"]',
        '}\n'
    ];
    fs.writeFileSync(path.join(projectPath, 'package.json'), json.join('\n'));

    // Mark the folder as a RAIN project by writing a ghost file.
    fs.writeFileSync(path.join(projectPath, '.rain'), '');
}

module.exports = register;

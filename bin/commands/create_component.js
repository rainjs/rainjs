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
    utils = require('../lib/utils'),
    component = require('../lib/component');

/**
 * Register the create component command.
 *
 * @param {Program} program
 */
function register(program) {
    program
        .command('create-component <component-name> [component-version]')
        .description('Create a new RAIN component in the current project.')
        .action(createComponent);
}

/**
 * Create a new RAIN component in the current RAIN project.
 *
 * @param {String} name the component name
 * @param {String} version the component version
 */
function createComponent(name, version, options) {
    try {
        var cmp = component.create(utils.getProjectRoot(process.cwd()), name, version);
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }

    if (options.parent.verbose) {
        console.log([
            ('Component ' + cmp.id + ' version ' + cmp.version + ' created').green,
            '',
            'Go to the projectRoot directory of the project and start the server.',
            '  $ ' + ('raind').green,
            '',
            'Open ' + ('http://localhost:1337/' + name
                    + (version ? ('/' + version) : '') + '/index').blue
                    + ' to see the component.',
            ''
        ].join('\n'));
    }
}

module.exports = register;

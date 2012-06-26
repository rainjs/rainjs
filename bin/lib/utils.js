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
    wrench = require('wrench'),
    fs = require('fs');

var root = path.resolve(__dirname, '..', '..');

/**
 * Gets the project root by doing a bottom up search from a directory received as a parameter.
 *
 * @param {String} cwd the directory to start searching from
 * @returns {String} the project root path
 * @throws {Error} if it reaches /
 */
function getProjectRoot(cwd) {
    return (function getRoot(dir) {
        if ('/' == dir) {
            throw new Error('The specified path is not a RAIN project.');
        }

        try {
            fs.statSync(path.join(dir, '.rain'));
            return dir;
        } catch (e) {
            return getRoot(path.dirname(dir));
        }
    })(cwd);
}

/**
 * Create the folder structure for a component.
 *
 * @param {String} projectPath the project path
 * @param {String} name the component name
 * @param {String} [version] the component version
 */
function setupComponent(projectPath, name, version) {
    var componentPath = path.join(projectPath, 'components', name);
    if (version) {
        componentPath = componentPath + '_' + version;
    }

    if (componentExists(componentPath)) {
        utils.log('Component folder already exists!'.red);
        return utils.destroyStdin();
    }

    var initComponentFolder = path.resolve(path.join(__dirname, '../init/component'));

    // Create component directory.
    fs.mkdirSync(componentPath, '0755');

    // Copy the contents of the init component folder to the new component path.
    wrench.copyDirSyncRecursive(initComponentFolder, componentPath);

    // Update the placeholders with actual component information.
    updatePlaceholders(path.join(componentPath, 'meta.json'), {
        'component_name': name,
        'component_version': version || '1.0'
    });
    updatePlaceholders(path.join(componentPath, 'client', 'templates', 'index.html'), {
        'component_name': name
    });
}

/**
 * Update placeholders in a specific file.
 *
 * @param {String} filePath the file path
 * @param {Object} placeholders the placeholder map
 */
function updatePlaceholders(filePath, placeholders) {
    var fileContent = fs.readFileSync(filePath, 'utf8'),
        regExp,
        key;

    for (key in placeholders) {
        if (placeholders.hasOwnProperty(key)) {
            regExp = new RegExp('\{\{' + key + '\}\}', 'g');
            fileContent = fileContent.replace(regExp, placeholders[key]);
        }
    }

    fs.writeFileSync(filePath, fileContent, 'utf8');
}

/**
 * Checks is a component path exists.
 *
 * @param {String} componentPath the component path
 * @returns {Boolean} true is the folder exists
 */
function componentExists(componentPath) {
    return path.existsSync(componentPath);
}

module.exports = {
    getProjectRoot: getProjectRoot,
    setupComponent: setupComponent
};

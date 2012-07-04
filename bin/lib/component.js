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
    wrench = require('wrench');

/**
 * RAIN component.
 *
 * @param {String} id the component name
 * @param {String} version the component version
 * @constructor
 */
function Component(id, version) {
    this.id = id;
    this.version = version;
}

/**
 * Create a new component.
 *
 * @param {String} id the component name
 * @param {String} [version='1.0.0'] the component version
 * @returns {Component} the newly created component
 * @throws {Error} if the component already exists
 * @throws {Error} if the component path already exists
 */
Component.create = function (projectRoot, id, version) {
    var componentsDir = path.join(projectRoot, 'components'),
        skeleton = path.resolve(path.join(__dirname, '../init/component'));

    version = version || '1.0';

    var componentPath = path.join(componentsDir, id);

    if (fs.existsSync(componentPath)) {
        componentPath +=  '_' + version;

        if (fs.existsSync(componentPath)) {
            throw new Error('Component ' + id + ' version ' + version + ' already exists.');
        }
    }

    fs.mkdirSync(componentPath, '0755');
    wrench.copyDirSyncRecursive(skeleton, componentPath);
    this._updatePlaceholders(path.join(componentPath, 'meta.json'), {
        'component_name': id,
        'component_version': version
    });
    this._updatePlaceholders(path.join(componentPath, 'client', 'templates', 'index.html'), {
        'component_name': id
    });

    return new Component(id, version);
};

/**
 * Update placeholders in a specific file.
 *
 * @param {String} filePath the file path
 * @param {Object} placeholders the placeholder map
 */
Component._updatePlaceholders = function (filePath, placeholders) {
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
};

module.exports = Component;

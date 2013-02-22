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
    Handlebars = require('../handlebars'),
    configuration = require('../configuration'),
    logger = require('../logging').get(),
    util = require('../util');

/**
 * Precompiles the templates associated with a component.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(componentConfig) {
    var language = configuration.language;
    var defaultLanguage = configuration.defaultLanguage;

    if (!componentConfig.views) {
        return;
    }

    var templatesFolder = componentConfig.paths('templates', true);
    for (var viewId in componentConfig.views) {
        var viewObj = componentConfig.views[viewId];
        viewObj.view = viewObj.view || (viewId + '.html');

        var basename = viewObj.view.substr(0, viewObj.view.indexOf(".html"));

        var filePath = getFilePath(templatesFolder, basename, language) ||
                       getFilePath(templatesFolder, basename, defaultLanguage) ||
                       getFilePath(templatesFolder, basename, 'en_US');

        if (!filePath) {
            delete componentConfig.views[viewId];
            continue;
        }

        var content = fs.readFileSync(filePath).toString();
        try {
            viewObj.compiledTemplate = Handlebars.compile(content);
        } catch (err) {
            delete componentConfig.views[viewId];
            logger.error(util.format('Failed to precompile template %s!', filePath), err);
        }
    }
}

/**
 * Checks if the file exists and returns the path.
 *
 * !!en_US templates are not suffixed!!
 *
 * @param {String} templatesFolder Folder where the templates are located
 * @param {String} baseName the baseName of the template (without .html)
 * @param {String} language The language
 * @returns {String} the file path or null
 */
function getFilePath(templatesFolder, baseName, language) {
    var filePath;

    if (language == 'en_US') {
        filePath = path.join(templatesFolder, baseName + '.html');
    } else {
        filePath = path.join(templatesFolder, baseName + '_' + language + '.html');
    }

    if (fs.existsSync(filePath)) {
        return filePath;
    }

    return null;
}

module.exports = {
    name: "Precompile Templates Plugin",
    configure: configure
};

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
    extend = require('node.extend'),
    util = require('../../lib/util');

/**
 * Register the generate localization files command.
 *
 * @param {Program} program
 */
function register(program) {
    program
        .command('generate-po-files <source-locale> <output-locales> [component-id]')
        .description('Extract the translation messages from the components\' code and generate ' +
                     'the localization files (.po) in different languages.')
        .action(generateLocalizationFiles);
}

/**
 * Generate the .po files.
 *
 * @param {String} sourceLocale the locale that is used for the messages (usually this is the same as the 'default_language' in the server's configuration file
 * @param {String} outputLocales a comma separated list of output locales
 * @param {String} [componentId] the component identifier (id;version)
 */
function generateLocalizationFiles(sourceLocale, outputLocales, componentId) {
    try {
        var projectRoot = utils.getProjectRoot(process.cwd()),
            componentsFolder = path.join(projectRoot, 'components'),
            components = scanComponents(componentsFolder);

        for (var i = components.length; i--;) {
            var module = components[i].id + ';' + components[i].version;
            if (componentId && module != componentId) {
                continue;
            }

            try {
                var translations = parseComponent(components[i]);
                console.log(JSON.stringify(translations));
            } catch (ex) {
                console.log(ex.message.red);
            }
        }
    } catch (ex) {
        console.log(ex.message.red);
        return;
    }
}

/**
 * Scan the components folder and read the meta file.
 *
 * @param {String} componentsFolder the components folder
 * @returns {Array}
 */
function scanComponents(componentsFolder) {
    var components = [],
        folders;
    try {
        folders = fs.readdirSync(componentsFolder);
    } catch (ex) {
        throw new RainError('The components folder: ' + componentsFolder + ' does not exist!',
            RainError.ERROR_IO);
    }

    for (var i = 0, len = folders.length; i < len; i++) {
        var componentPath = path.join(componentsFolder, folders[i]);
        try {
            if (!fs.statSync(componentPath).isDirectory()) {
                continue;
            }
        } catch (ex) {
            console.log(('Failed to call stat for ' + componentPath).red);
            break;
        }

        try {
            var metaFile = path.join(componentPath, 'meta.json');
            var config = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
            config.folder = componentPath;
            components.push(config);
        } catch (ex) {
            console.log(('Failed to load meta.json from ' + componentPath + ' folder!').red);
        }
    }

    return components;
}

/**
 * Parse a component's files and extract the translations.
 *
 * @param {Object} component the component configuration
 * @returns {Object} the component's translations found in templates and .js files
 */
function parseComponent(component) {
    var translations = {};

    extend(translations, parseTemplateFiles(component));
    extend(translations, parseJsFiles(component));

    return translations;
}

/**
 * Extract the translations from a component's templates.
 *
 * @param {Object} component the component configuration
 * @returns {Object} the translation messages indexed by the file path
 */
function parseTemplateFiles(component) {
    var templatesFolder = path.join(component.folder, 'client/templates'),
        templateTranslations = {};

    util.walkSync(templatesFolder, ['.html'], function (filePath) {
        try {
            var matchString = '(((\\\\")?[^\\\\"]+(\\\\[^"])?(\\\\")?)+)',
                tRegExp = new RegExp('(?:{{t\\s+")' + matchString + '(?:")', 'gm'),
                ntRegExp = new RegExp('(?:{{nt\\s+")' + matchString + '(?:"\\s+")' +
                                                        matchString + '(?:")', 'gm'),
                text = fs.readFileSync(filePath, 'utf8'),
                matches,
                translations = [];

            while ((matches = tRegExp.exec(text)) != null) {
                if (matches.length < 2 || !matches[1]) {
                    continue;
                }

                translations.push(matches[1]);
            }

            while ((matches = ntRegExp.exec(text)) != null) {
                if (matches.length < 7 || !matches[1] || !matches[6]) {
                    continue;
                }

                translations.push([matches[1], matches[6]]);
            }

            if (translations.length > 0) {
                templateTranslations[filePath] = translations;
            }
        } catch (ex) {
            console.log(('Could not extract the template translations from ' + filePath).red,
                        ex.message);
        }
    });

    return templateTranslations;
}

/**
 * Extract the translations from a component's .js files.
 *
 * @param {Object} component the component configuration
 * @returns {Object} the translation messages indexed by the file path
 */
function parseJsFiles(component) {
    return {};
}

module.exports = register;

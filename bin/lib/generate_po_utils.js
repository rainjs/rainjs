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
    util = require('../../lib/util'),
    poUtils = require('../../lib/po_utils'),
    wrench = require('wrench');

/**
 * Utility class for the 'generate-po-files' SDK command.
 *
 * @name GeneratePoUtils
 * @class
 * @constructor
 */
function GeneratePoUtils() {}

/**
 * Generate the .po files.
 *
 * @param {String} outputLocales a comma separated list of output locales
 * @param {String} [componentId] the component identifier (id;version)
 */
GeneratePoUtils.prototype.generateLocalizationFiles = function (outputLocales, componentId) {
    try {
        var projectRoot = utils.getProjectRoot(process.cwd()),
            componentsFolder = path.join(projectRoot, 'components'),
            components = this.scanComponents(componentsFolder);

        for (var i = components.length; i--;) {
            var module = components[i].id + ';' + components[i].version;
            if (componentId && module != componentId) {
                continue;
            }

            try {
                var parsedTranslations = this.parseComponent(components[i]),
                    poTranslations = this.loadPoFiles(components[i], outputLocales.split(','));

                this.compareTranslations(components[i], poTranslations, parsedTranslations);
                this.createPoFiles(components[i], poTranslations);
            } catch (ex) {
                console.log(ex.message.red);
            }

            if (module == componentId) {
                break;
            }
        }
    } catch (ex) {
        console.log(ex.message.red);
        return;
    }
};

/**
 * Scan the components folder and read the meta file.
 *
 * @param {String} componentsFolder the components folder
 * @returns {Array}
 */
GeneratePoUtils.prototype.scanComponents = function (componentsFolder) {
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
};

/**
 * Parse a component's files and extract the translations.
 *
 * @param {Object} component the component configuration
 * @returns {Object} the component's translations found in templates and .js files
 */
GeneratePoUtils.prototype.parseComponent = function (component) {
    var translations = {};

    extend(translations, this.parseTemplateFiles(component));
    extend(translations, this.parseJsFiles(component));

    return translations;
};

/**
 * Extract the translations from a component's templates.
 *
 * @param {Object} component the component configuration
 * @returns {Object} the translation messages indexed by the file path
 */
GeneratePoUtils.prototype.parseTemplateFiles = function (component) {
    var matchString = '(((\\\\")?[^\\\\"]+(\\\\[^"])?(\\\\")?)+)',
        tPattern = '(?:{{t\\s+")' + matchString + '(?:")',
        ntPattern = '(?:{{nt\\s+")' + matchString + '(?:"\\s+")' + matchString + '(?:")';

    return this.parseFiles({
        folder: path.join(component.folder, 'client/templates'),
        extensions: ['.html'],
        tPattern: tPattern,
        ntPattern: ntPattern
    });
};

/**
 * Extract the translations from a component's .js files.
 *
 * @param {Object} component the component configuration
 * @returns {Object} the translation messages indexed by the file path
 */
GeneratePoUtils.prototype.parseJsFiles = function (component) {
    var matchString = '(((\\\\\')?[^\\\\\']+(\\\\[^\'])?(\\\\\')?)+)',
        tPattern = '(?:(?:\\s|\\()t\\s*\\(\\s*\')' + matchString + '(?:\')',
        ntPattern = '(?:(?:\\s|\\()nt\\s*\\(\\s*\')' + matchString + '(?:\'\\s*,\\s*\')' +
                                                       matchString + '(?:\')';

    var translations = this.parseFiles({
        folder: path.join(component.folder, 'client/js'),
        extensions: ['.js'],
        tPattern: tPattern,
        ntPattern: ntPattern
    });

    extend(translations, this.parseFiles({
        folder: path.join(component.folder, 'server'),
        extensions: ['.js'],
        tPattern: tPattern,
        ntPattern: ntPattern
    }));

    return translations;
};

/**
 * Extract the translations from a component's folder.
 *
 * @param {Object} options the parse options
 * @param {String} options.folder the component folder that will be scanned
 * @param {String} options.extensions the extensions used to filter the folder files
 * @param {String} options.tPattern the pattern to extract the t translations
 * @param {String} options.ntPattern the pattern to extract the nt translations
 * @returns {Object} the translation messages indexed by the file path
 */
GeneratePoUtils.prototype.parseFiles = function (options) {
    var folderTranslations = {};

    util.walkSync(options.folder, options.extensions, function (filePath) {
        try {
            var tRegExp = new RegExp(options.tPattern, 'gm'),
                ntRegExp = new RegExp(options.ntPattern, 'gm'),
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
                folderTranslations[filePath] = translations;
            }
        } catch (ex) {
            console.log(('Could not extract the template translations from ' + filePath).red,
                        ex.message);
        }
    });

    return folderTranslations;
};

/**
 * Load all the .po files of a component.
 *
 * @param {Object} component the component configuration
 * @param {Array} locales the output locales
 * @returns {Object} the po messages indexed by the file path
 */
GeneratePoUtils.prototype.loadPoFiles = function (component, locales) {
    var poTranslations = {},
        localeFolder = path.join(component.folder, 'locale'),
        uniqueMessages = {};

    util.walkSync(localeFolder, ['.po'], function (filePath) {
        var poContent = fs.readFileSync(filePath, 'utf8'),
            po = poUtils.parsePo(poContent);

        poTranslations[filePath] = po;
        extend(uniqueMessages, po);

        var language = filePath.substring(localeFolder.length + 1).split(path.sep)[0];
        var index = locales.indexOf(language);
        if (index > -1) {
            locales.splice(index, 1);
        }
    });

    delete uniqueMessages[''];
    for (var i = locales.length; i--;) {
        var messagesPath = path.join(localeFolder, locales[i], 'messages.po');
        poTranslations[messagesPath] = {
            '': {
                'Content-Type': 'text/plain; charset=UTF-8\\n',
                'Plural-Forms': 'nplurals=2; plural=(n != 1);\\n'
            }
        };
        extend(poTranslations[messagesPath], uniqueMessages);
    }

    return poTranslations;
};

/**
 * Compare the .po translations with the parsed translations and update the .po translation in
 * order to be up to date.
 *
 * @param {Object} component the component configuration
 * @param {Object} poTranslations the .po translations
 * @param {Object} parsedTranslations the parsed translations
 */
GeneratePoUtils.prototype.compareTranslations = function (component,
                                                          poTranslations,
                                                          parsedTranslations) {
    this.updateExistingTranslations(poTranslations, parsedTranslations);
    this.addNewTranslations(component, poTranslations, parsedTranslations);
};

/**
 * Remove old translations and add the plural form for existing ones (if the plural form is not
 * found).
 *
 * @param {Object} poTranslations the .po translations
 * @param {Object} parsedTranslations the parsed translations
 */
GeneratePoUtils.prototype.updateExistingTranslations = function (poTranslations,
                                                                 parsedTranslations) {
    for (var path in poTranslations) {
        var translations = poTranslations[path];
        for (var messageId in translations) {
            if (messageId === '') {
                continue;
            }

            var parsed = this.searchParsedTranslation(parsedTranslations, messageId);
            if (!parsed) {
                delete translations[messageId];
                continue;
            }

            var message = translations[messageId];
            if (Array.isArray(parsed) && !message[0]) {
                message[0] = parsed[1];
            }
        }
    }
};

/**
 * Search for a parsed message.
 *
 * @param {Object} parsedTranslations the parsed translations
 * @param {String} messageId the message id
 * @returns {String|Array} the message
 */
GeneratePoUtils.prototype.searchParsedTranslation = function (parsedTranslations, messageId) {
    for (var path in parsedTranslations) {
        var translations = parsedTranslations[path];
        for (var i = translations.length; i--;) {
            if (Array.isArray(translations[i]) && translations[i][0] == messageId) {
                return translations[i];
            }
            if (translations[i] == messageId) {
                return translations[i];
            }
        }
    }
};

/**
 * Search for a .po message.
 *
 * @param {Object} poTranslations the .po translations
 * @param {String} messageId the message id
 * @returns {Array} the message will all available forms
 */
GeneratePoUtils.prototype.searchPoTranslation = function (poTranslations, messageId) {
    for (var path in poTranslations) {
        var translations = poTranslations[path];
        if (translations[messageId]) {
            return translations[messageId];
        }
    }
};

/**
 * Add new translations found by parsing the files in the .po translations.
 *
 * @param {Object} component the component configuration
 * @param {Object} poTranslations the .po translations
 * @param {Object} parsedTranslations the parsed translations
 */
GeneratePoUtils.prototype.addNewTranslations = function (component,
                                                         poTranslations,
                                                         parsedTranslations) {
    for (var parsedPath in parsedTranslations) {
        var translations = parsedTranslations[parsedPath];
        for (var i = translations.length; i--;) {
            var messageId, messageIdPlural = null;
            if (Array.isArray(translations[i])) {
                messageId = translations[i][0];
                messageIdPlural = translations[i][1];
            } else {
                messageId = translations[i];
            }

            if (this.searchPoTranslation(poTranslations, messageId)) {
                continue;
            }

            // Add the new translation one time for each language.
            var locales = [];
            for (var poPath in poTranslations) {
                var localeFolder = path.join(component.folder, 'locale'),
                    language = poPath.substring(localeFolder.length + 1).split(path.sep)[0];

                if (locales.indexOf(language) == -1) {
                    var translation = poTranslations[poPath];
                    translation[messageId] = [messageIdPlural, messageId];
                    locales.push(language);
                }
            }
        }
    }
};

/**
 * Create or update the .po files.
 *
 * @param {Object} component the component configuration
 * @param {Object} poTranslations the .po translations
 */
GeneratePoUtils.prototype.createPoFiles = function (component, poTranslations) {
    for (var poPath in poTranslations) {
        var translations = poTranslations[poPath];

        if (Object.keys(translations).length < 2) {
            continue;
        }

        wrench.mkdirSyncRecursive(path.dirname(poPath), '0755');

        var content = this.composePoContent(translations);
        fs.writeFileSync(poPath, content, 'utf8');
    }
};

/**
 * Create the content of a .po file based on the translations object.
 *
 * @param {Object} translations the translations object
 * @returns {String} the .po content
 */
GeneratePoUtils.prototype.composePoContent = function (translations) {
    var content = '',
        headers = translations[''];
    if (headers) {
        content += 'msgid ""\n' + 'msgstr ""\n';
        for (var key in headers) {
            content += '"' + key + ': ' + headers[key] + '"\n';
        }
    }

    for (var messageId in translations) {
        if (messageId == '') {
            continue;
        }

        content += '\n';
        var data = translations[messageId];
        content += 'msgid "' + messageId + '"\n';
        if (data[0] != null) {
            content += 'msgid_plural "' + data[0] + '"\n';
            data[2] = data[2] || data[0];
            for (var i = 1, len = data.length; i < len; i++) {
                content += 'msgstr[' + (i - 1) + '] "' + data[i] + '"\n';
            }
        } else {
            content += 'msgstr "' + data[1] + '"\n';
        }
    }

    return content;
};

module.exports = GeneratePoUtils;

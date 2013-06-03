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
    utils = require('./utils'),
    extend = require('node.extend'),
    util = require('../../lib/util'),
    poUtils = require('../../lib/po_utils'),
    esprima = require('esprima'),
    wrench = require('wrench'),
    Handlebars = require('handlebars');

/**
 * Utility class for the 'generate-po-files' SDK command.
 *
 * @name GeneratePoUtils
 * @class
 * @constructor
 */
function GeneratePoUtils() {}

/**
 * Generates .po files.
 * Goes through the list of components, extracts messages from the source code,
 * merges them with the existing .po messages and generates updated .po files.
 * Entry point to the utility class' functions.
 *
 * @param {String} outputLocales a comma separated list of output locales
 * @param {String} [componentId] the component identifier (id;version)
 */
GeneratePoUtils.prototype.generateLocalizationFiles = function (outputLocales, componentId) {
    var projectRoot = utils.getProjectRoot(process.cwd()),
        componentsFolder = path.join(projectRoot, 'components'),
        components = this._scanComponents(componentsFolder),
        locales = outputLocales.split(',').map(function (locale) { return locale.trim(); });

    for (var i = components.length; i--;) {
        var currentComponentId = components[i].id + ';' + components[i].version;
        if (componentId && componentId !== currentComponentId) {
            continue;
        }

        try {
            var parsedTranslations = this._parseComponent(components[i]),
                poTranslations = this._loadPoFiles(components[i], locales);

            this._updateTranslations(components[i], poTranslations, parsedTranslations);
            this._createPoFiles(components[i], poTranslations);
        } catch (ex) {
            console.log(('Failed to generate po files for ' + currentComponentId + ': '
                + ex.message).red);
        }

        if (currentComponentId === componentId) {
            break;
        }
    }
};

/**
 * Scans the components folder and read the meta file.
 *
 * @param {String} componentsFolder the components folder
 * @returns {Array} array of component descriptor files (meta.json) with added folder information
 */
GeneratePoUtils.prototype._scanComponents = function (componentsFolder) {
    var components = [],
        folders = fs.readdirSync(componentsFolder);

    for (var i = 0, len = folders.length; i < len; i++) {
        var componentPath = path.join(componentsFolder, folders[i]);
        if (!fs.statSync(componentPath).isDirectory()) {
            continue;
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
 * Parses a component's files and extracts the translations.
 *
 * @param {Object} component the component configuration
 * @returns {Object} the component's translations found in template and javascript files
 */
GeneratePoUtils.prototype._parseComponent = function (component) {
    var translations = {};

    extend(translations, this._parseFiles({
        folders: [
            path.join(component.folder, 'client/templates'),
            path.join(component.folder, 'client/partials')
        ],
        extensions: ['.html'],
        parser: this._parseTemplateFile.bind(this)
    }));

    extend(translations, this._parseFiles({
        folders: [
            path.join(component.folder, 'client/js'),
            path.join(component.folder, 'server')
        ],
        extensions: ['.js'],
        parser: this._parseJsFile.bind(this)
    }));

    return translations;
};

/**
 * Extracts the translations from a component's folder.
 *
 * @param {Object} options the parse options
 * @param {Array} options.folders the component folders that will be scanned
 * @param {Array} options.extensions the extensions used to filter the folder files
 * @param {Function} options.parser the function used to parse the file content
 * @returns {Object} the translation messages indexed by the file path
 */
GeneratePoUtils.prototype._parseFiles = function (options) {
    var folderTranslations = {};

    options.folders.forEach(function (folder) {
        util.walkSync(folder, options.extensions, function (filePath) {
            try {
                var text = fs.readFileSync(filePath, 'utf8'),
                    translations = options.parser(text);

                if (translations.length > 0) {
                    folderTranslations[filePath] = translations;
                }
            } catch (ex) {
                throw new Error('Could not extract the template translations from ' + filePath +
                    ': ' + ex.message);
            }
        });

    });

    return folderTranslations;
};

/**
 * Parses a javascript file and extracts the translation
 *
 * @param {String} text the content of the javascript file
 * @returns {[Object]} the array of translations found in .js files
 */
GeneratePoUtils.prototype._parseJsFile = function (text) {
    var found = true,
        argumentsPerFile = [],
        argumentsOfFile = [];

    while(found) {
        var translationFoundPattern = text.match(/([^\w\.]|^)(t|nt)\(/);

        if (!translationFoundPattern) {
            found = false;
        } else {
            var restartIndex =  translationFoundPattern.index + translationFoundPattern[0].length,
                isInStringSingleQuote = false,
                isInStringDoubleQuote = false,
                functionArguments = '';

            while(!(text[restartIndex] === ')'  &&
                    (!isInStringSingleQuote || !isInStringDoubleQuote))) {
                functionArguments += text[restartIndex];
                if(text[restartIndex] === "'") {
                    if(!isInStringSingleQuote) {
                        isInStringSingleQuote = true;
                    } else {
                        isInStringSingleQuote = false;
                    }
                }

                if(text[restartIndex] === '"') {
                    if(!isInStringDoubleQuote) {
                        isInStringDoubleQuote = true;
                    } else {
                        isInStringDoubleQuote = false;
                    }
                }

                restartIndex++;
            }

            argumentsPerFile.push({
                params: functionArguments,
                type: translationFoundPattern[2]
            });

            var translationFunction = text.substring(translationFoundPattern.index, restartIndex);
            text = text.substring(restartIndex);
        }
    }

    for(var i = 0, len = argumentsPerFile.length; i < len; i++) {
        argumentsOfFile.push(
            this._splitArguments(argumentsPerFile[i].params, argumentsPerFile[i].type)
        );
    }

    return argumentsOfFile;
};

/**
 * Parses the translation function of it's arguments. Esprima module will parse your
 * text and generate
 *
 * @param {String} functionArgs the arguments of the translation function
 * @param {String} type the type of function ``t`` or ``nt``
 * @throws {Error} not a valid call of ``t`` or ``nt`` function.
 */
GeneratePoUtils.prototype._splitArguments = function(functionArgs, type) {

    var parmetersOfFunction = {},
        literalArgs = [];

    var parameters = esprima.parse(functionArgs);
    var parsedBody = parameters.body[0].expression;
    if (parsedBody.type === 'SequenceExpression') {
        for(var j = 0, len = parsedBody.expressions.length; j < len; j++) {
            if (parsedBody.expressions[j].type && parsedBody.expressions[j].type === 'Literal') {
                literalArgs.push(parsedBody.expressions[j].value);
            }
        }
    } else if (parsedBody.type === 'Literal') {
        literalArgs.push(parsedBody.value);
    }

    if(literalArgs.length === 1) {
        if(type === 't') {
            parmetersOfFunction = {
                msgid: literalArgs[0]
            };
        } else {
            throw new Error('Invalid call of function ``nt``');
        }
    } else if(literalArgs.length === 2){
        if (type === 't') {
            parmetersOfFunction = {
                id: literalArgs[0],
                msgid: literalArgs[1]
            };
        } else {
            parmetersOfFunction = {
                msgid: literalArgs[0],
                msgidPlural: literalArgs[1]
            };
        }
    } else {
        if(type === 'nt') {
            parmetersOfFunction = {
                id: literalArgs[0],
                msgid: literalArgs[1],
                msgidPlural: literalArgs[2]
            };
        } else {
            throw new Error('Invalid call of function ``t``');
        }
    }

    if(parmetersOfFunction) {
        return parmetersOfFunction;
    }
};

/**
 * Extracts the translations from a template. Returns an array of objects with the following
 * properties: ``msgid``, ``msgidPlural``, ``id``.
 *
 * @param {String} text the template to be parsed
 * @returns {Array} the translation messages found in this file
 */
GeneratePoUtils.prototype._parseTemplateFile = function (text) {
    var parsedTemplate = Handlebars.parse(text);

    return this._inspectStatements(parsedTemplate.statements);
};

/**
 * Iterates through the statements found in a template and extracts ``msgid``, ``msgidPlural``
 * and ``id`` from the ``t`` and ``nt`` helpers
 *
 * @param {Array} statements the statements found in the template
 * @returns {Array} the translation messages found
 */
GeneratePoUtils.prototype._inspectStatements = function (statements) {
    var translations = [];

    var helpers = {
        t: {paramCount: 1},
        nt: {paramCount: 2}
    };

    for (var i = 0, len = statements.length; i < len; i++) {
        var statement = statements[i];

        // block helper
        if (statement.type === 'block') {
            var blockTranslations = this._inspectStatements(statement.program.statements);
            translations = translations.concat(blockTranslations);
        }

        // handlebars helper (isHelper is true if this statement has parameters)
        if (statement.type === 'mustache' && statement.isHelper) {
            var ids = [],
                helperName = statement.id.string,
                params = statement.params,
                pairs = (statement.hash && statement.hash.pairs) || [];

            if (!helpers[helperName]) {
                continue;
            }

            var paramCount = helpers[helperName].paramCount;
            var paramValues = this._getParamValues(params, paramCount);

            var translation = {
                msgid: paramValues[0],
                msgidPlural: paramValues[1],
                id: this._getIdValue(pairs)
            };

            translations.push(translation);
        }
    }

    return translations;
};

/**
 * Extracts parameter values from a helper positional parameters.
 *
 * @param {Array} params the helper parameters
 * @param {Number} count the number of parameters to extract
 * @returns {Array} the extracted parameter values
 * @throws {Error} when there are fewer parameters than the specified count
 * @throws {Error} when one of the parameter has a value that is not a string literal
 */
GeneratePoUtils.prototype._getParamValues = function (params, count) {
    if (params.length < count) {
        throw new Error("Invalid number of params.");
    }

    var values = [];

    for (var i = 0; i < count; i++) {
        if (params[i].type !== "STRING") {
            throw new Error("msgid and msgid_plural should be strings.");
        }

        values.push(params[i].string);
    }

    return values;
};

/**
 * Returns the value of the ``id`` property from the hash of a Handlebars helper if it exists.
 *
 * @param {Array} pairs the key value pairs
 * @returns {String} the value of the ``id`` property
 * @throws {Error} when the value of the ``id`` property is not a string literal
 */
GeneratePoUtils.prototype._getIdValue = function (pairs) {
    for (var i = 0, len = pairs.length; i < len; i++) {
        var pair = pairs[i];

        if (pair[0] !== 'id') {
            continue;
        }

        if (pair[1].type !== 'STRING') {
            throw new Error("id value should be a string");
        }

        return pair[1].string;
    }
};

/**
 * Loads all the .po files of a component.
 *
 * @param {Object} component the component configuration
 * @param {Array} locales the output locales
 * @returns {Object} the po messages indexed by the file path
 */
GeneratePoUtils.prototype._loadPoFiles = function (component, locales) {
    var poTranslations = {},
        localeFolder = path.join(component.folder, 'locale');

    var missingLocales = [];
    for (var i = 0, len = locales.length; i < len; i++) {
        missingLocales[i] = locales[i];
    }

    util.walkSync(localeFolder, ['.po'], function (filePath) {
        var language = filePath.substring(localeFolder.length + 1).split(path.sep)[0],
            index = locales.indexOf(language);

        if (index > -1) {
            var poContent = fs.readFileSync(filePath, 'utf8'),
                po = poUtils.parsePo(poContent),
                missingIndex = missingLocales.indexOf(language);

            if (missingIndex > -1) {
                missingLocales.splice(missingIndex, 1);
            }
            poTranslations[filePath] = po;
        }
    });

    for (var i = missingLocales.length; i--;) {
        var messagesPath = path.join(localeFolder, missingLocales[i], 'messages.po');
        poTranslations[messagesPath] = {
            '': {
                'Content-Type': 'text/plain; charset=UTF-8',
                'Plural-Forms': 'nplurals=2; plural=(n != 1);'
            }
        };
    }

    return poTranslations;
};

/**
 * Compares the .po translations with the parsed
 * translations and updates the .po translation.
 *
 * @param {Object} component the component configuration
 * @param {Object} poTranslations the .po translations
 * @param {Object} parsedTranslations the parsed translations
 */
GeneratePoUtils.prototype._updateTranslations = function (component,
                                                          poTranslations, parsedTranslations) {
    this._updateExistingTranslations(poTranslations, parsedTranslations);
    this._addNewTranslations(component, poTranslations, parsedTranslations);
};

/**
 * Removes old translations and adds the plural form for existing ones
 * (if the plural form is not found).
 *
 * @param {Object} poTranslations the .po translations
 * @param {Object} parsedTranslations the parsed translations
 */
GeneratePoUtils.prototype._updateExistingTranslations = function (poTranslations,
                                                                  parsedTranslations) {
    for (var path in poTranslations) {
        var translations = poTranslations[path];
        for (var messageId in translations) {
            if (messageId === '') {
                continue;
            }

            var parsedTranslation = this._searchParsedTranslation(parsedTranslations, messageId);
            if (!parsedTranslation) {
                delete translations[messageId];
                continue;
            }


            var poTranslation = translations[messageId];

            // checks if the plural form was added, changed or removed
            if (poTranslation[0] !== parsedTranslation.msgidPlural) {
                poTranslation[0] = parsedTranslation.msgidPlural;
                poTranslation[2] = parsedTranslation.msgidPlural;
             }
        }
    }
};

/**
 * Searches for a message id in the list of parsed translations.
 *
 * @param {Object} parsedTranslations the parsed translations
 * @param {String} messageId the message id
 * @returns {Object} the message
 */
GeneratePoUtils.prototype._searchParsedTranslation = function (parsedTranslations, messageId) {
    for (var path in parsedTranslations) {
        var translations = parsedTranslations[path];

        for (var i = translations.length; i--;) {
            var parsedMessageId = translations[i].id || translations[i].msgid;
            if (parsedMessageId === messageId) {
                return translations[i];
            }
        }
    }
};

/**
 * Adds new translations found by parsing the files in the .po translations.
 *
 * @param {Object} component the component configuration
 * @param {Object} poTranslations the .po translations
 * @param {Object} parsedTranslations the parsed translations
 */
GeneratePoUtils.prototype._addNewTranslations = function (component,
                                                         poTranslations,
                                                         parsedTranslations) {
    for (var parsedPath in parsedTranslations) {
        var translations = parsedTranslations[parsedPath];

        for (var i = translations.length; i--;) {
            var translation = translations[i],
                messageId = translation.id || translation.msgid;

            // Add the new translation for each file in which it doesn't exists.
            for (var poPath in poTranslations) {
                var poTranslation = poTranslations[poPath];
                if (!poTranslation[messageId]) {
                    poTranslation[messageId] = [translation.msgidPlural, translation.msgid];
                }
            }
        }
    }
};

/**
 * Creates or updates the .po files.
 *
 * @param {Object} component the component configuration
 * @param {Object} poTranslations the .po translations
 */
GeneratePoUtils.prototype._createPoFiles = function (component, poTranslations) {
    for (var poPath in poTranslations) {
        var translations = poTranslations[poPath];

        if (Object.keys(translations).length < 2) {
            continue;
        }

        wrench.mkdirSyncRecursive(path.dirname(poPath), '0755');

        var content = this._composePoContent(translations);
        fs.writeFileSync(poPath, content, 'utf8');
    }
};

/**
 * Creates the content of a .po file based on the translations object.
 *
 * @param {Object} translations the translations object
 * @returns {String} the .po content
 */
GeneratePoUtils.prototype._composePoContent = function (translations) {
    var content = '',
        headers = translations[''];
    if (headers) {
        content += 'msgid ""\n' + 'msgstr ""\n';
        for (var key in headers) {
            content += '"' + key + ': ' + headers[key] + '\\n"\n';
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

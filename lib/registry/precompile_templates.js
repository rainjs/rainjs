"use strict";

var path = require('path');
var fs = require('fs');
var Handlebars = require('../handlebars');
var configuration = require('../configuration');

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

        var basename = path.basename(viewObj.view, '.html');

        var filePath = getFilePath(templatesFolder, basename, language);
        if (!filePath) {
            filePath = getFilePath(templatesFolder, basename, defaultLanguage);
        }
        if (!filePath) {
            filePath = getFilePath(templatesFolder, basename, 'en_US');
        }
        try {
            var content = fs.readFileSync(filePath).toString();
            viewObj.compiledTemplate = Handlebars.compile(content);
        } catch (ex) {
            delete componentConfig.views[viewId];
            console.log('Failed to precompile template %s!', [filePath]);
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

    if (path.existsSync(filePath)) {
        return filePath;
    }

    return null;
}

module.exports = {
    name: "Precompile Templates Plugin",
    configure: configure
};

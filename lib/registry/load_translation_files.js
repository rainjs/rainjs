"use strict";

var path = require('path');
var translation = require('../translation');
var configuration = require('../configuration');
var util = require('../util');

/**
 * Load the translation files for the current language and the default language.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(componentConfig) {
    loadFiles(componentConfig, configuration.language);
    if (configuration.defaultLanguage !== configuration.language) {
        loadFiles(componentConfig, configuration.language);
    }
}

/**
 * Load the translation files for a specific language.
 *
 * @param {Object} componentConfig the meta.json information
 * @param {String} language the language
 */
function loadFiles(componentConfig, language) {
    var localeFolder = componentConfig.paths('locale', true);
    var languageFolder = path.join(localeFolder, language);

    util.walkSync(languageFolder, ['.po'], function (filePath) {
        translation.loadLanguageFile(filePath, language, componentConfig);
    });
}

module.exports = {
    name: "Load translation files plugin",
    configure: configure
};

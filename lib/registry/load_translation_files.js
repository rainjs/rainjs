"use strict";

var path = require('path'),
    Translation = require('../translation'),
    configuration = require('../configuration'),
    util = require('../util');

/**
 * Load the translation files for the current language and the default language.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(component) {
    loadFiles(component, configuration.language);
    if (configuration.defaultLanguage !== configuration.language) {
        loadFiles(component, configuration.defaultLanguage);
    }
}

/**
 * Load the translation files for a specific language.
 *
 * @param {Object} component the meta.json information
 * @param {String} language the language
 */
function loadFiles(component, language) {
    var translation = Translation.get(),
        localeFolder = component.paths('locale', true),
        languageFolder = path.join(localeFolder, language);

    util.walkSync(languageFolder, ['.po'], function (filePath) {
        translation.loadLanguageFile(filePath, language, component);
    });
}

module.exports = {
    name: "Load translation files plugin",
    configure: configure
};

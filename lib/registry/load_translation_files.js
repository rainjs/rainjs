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
    Translation = require('../translation'),
    util = require('../util'),
    fs = require('fs'),
    logger = require('../logging').get();

/**
 * Load the translation files for all the languages available in the component.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(component) {
    var localeFolder = component.paths('locale', true);

    try {
        var files = fs.readdirSync(localeFolder);
    } catch (ex) {
        // This component doesn't contain any locales.
        return;
    }

    for (var i = files.length; i--;) {
        var locale  = files[i]; //each folder in the locale folder represents a locale
        try {
            var stat = fs.statSync(path.join(localeFolder, locale));
            if (stat.isDirectory()) {
                loadFiles(component, locale);
            }
        } catch (err) {
            logger.warn('An error occurred loading translation files for ' +
                        component.id + ';' + component.version, err);
        }
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

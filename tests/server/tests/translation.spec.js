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

describe('Translation module', function() {
    describe('translate method', function () {
        var cwd = process.cwd(),
            path = require('path'),
            util = require(path.join(cwd, 'lib', 'util')),
            Translation = require(path.join(cwd, 'lib', 'translation')),
            translation;

        var component = {
            id: 'example',
            version: '4.5.2',
            folder: path.join(cwd, 'tests', 'server', 'fixtures', 'components', 'example_4_5_2')
        };

        beforeEach(function () {
            var localeFolder = path.join(component.folder, 'locale');

            translation = Translation.get();

            util.walkSync(path.join(localeFolder, 'en_US'), ['.po'], function (filePath) {
                translation.loadLanguageFile(filePath, 'en_US', component);
            });
            util.walkSync(path.join(localeFolder, 'ro_RO'), ['.po'], function (filePath) {
                translation.loadLanguageFile(filePath, 'ro_RO', component);
            });
        });

        it('should translate if message id exists', function () {
            expect(translation.translate(component, 'ro_RO', 'Send email'))
            .toEqual('Trimite email');
        });

        it('should return the message id, if translation doesn\'t exist', function () {
            expect(translation.translate(component, 'en_US', 'No translation'))
            .toEqual('No translation');
        });

        it('should correctly resolve arguments', function () {
            var message = translation.translate(
                    component, 'ro_RO', 'Dear %1$s %2$s,', undefined, undefined, ['Jhon', 'Doe']);
            expect(message).toEqual('Bună ziua domnule Doe,');
        });
    });

    describe('getLocale method', function() {
        var context, translation;
        beforeEach(function() {
            context = loadModuleContext('/lib/translation.js');
            translation = new context.Translation();
        });

        it('should throw an rain error if the component parameter is missing', function() {
            expect(function() {
                translation.getLocale();
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'component');
        });

        it('should throw an rain error if the locale parameter is missing', function() {
            expect(function() {
                translation.getLocale({});
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'locale');
        });

        it('should return an empty object cause no translation is existing', function() {
            expect(translation.getLocale(1, 2)).toEqual({});
        });

        it('should return the domain and data object of a locale', function() {
            context.locales['test 1.0'] = {
                'de': {
                    textdomain: function() { return "textdomain"; },
                    options: { locale_data: "translations" }
                }
            };

            //TODO find a way to mock private functions
            spyOn(context, 'computeLocaleId');
            var translationResult = translation.getLocale({
                id: 'test', version: '1.0'
            }, 'de');


            expect(translationResult.domain).toEqual("textdomain");
            expect(translationResult.data).toEqual("translations");
        });
    });

    describe('getLocales method', function() {
        var Translation, translation, configuration;
        var component = {
            id: 'test',
            version: '1.0'
        };

        beforeEach(function() {
            var mocks = {};
            configuration = mocks['./configuration'] = {};
            Translation = loadModuleExports('/lib/translation.js', mocks);
            translation = Translation.get();
            spyOn(translation, 'getLocale').andCallFake(function (component, locale) {
                return locale;
            });
        });

        it('should throw an error if the component parameter is missing', function() {
            expect(function() {
                translation.getLocales();
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'component');
        });

        it('should return two locales', function () {
            configuration.language = 'de_DE';
            configuration.defaultLanguage = 'en_US';

            expect(translation.getLocales(component, 'ro_RO'))
                .toEqual({language: 'ro_RO', defaultLanguage: 'en_US'});
            expect(translation.getLocale).toHaveBeenCalledWith(component, 'ro_RO');
            expect(translation.getLocale).toHaveBeenCalledWith(component, 'en_US');
        });

        it('should use the platform language when the language parameter is missing', function () {
            configuration.language = 'de_DE';
            configuration.defaultLanguage = 'en_US';

            expect(translation.getLocales(component))
                .toEqual({language: 'de_DE', defaultLanguage: 'en_US'});
            expect(translation.getLocale).toHaveBeenCalledWith(component, 'de_DE');
            expect(translation.getLocale).toHaveBeenCalledWith(component, 'en_US');
        });

        it('should return one locale when language and defaultLanguage are the same', function() {
            configuration.language = 'en_US';
            configuration.defaultLanguage = 'en_US';

            expect(translation.getLocales(component)).toEqual({language: 'en_US'});
            expect(translation.getLocale).toHaveBeenCalledWith(component, 'en_US');
        });
    });
});

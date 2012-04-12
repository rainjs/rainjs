"use strict";

var cwd = process.cwd(),
    path = require('path'),
    util = require(path.join(cwd, 'lib', 'util')),
    componentRegistry = require(path.join(cwd, 'lib', 'component_registry')),
    Translation = require(path.join(cwd, 'lib', 'translation'));

var component = {
    id: 'example',
    version: '4.5.2',
    folder: path.join(cwd, 'tests', 'server', 'fixtures', 'components', 'example_4_5_2')
};

describe('Testing translation modul', function() {
    describe('Text localization', function () {
        var translation = Translation.get(),
        localeFolder = path.join(component.folder, 'locale');

        util.walkSync(path.join(localeFolder, 'en_US'), ['.po'], function (filePath) {
            translation.loadLanguageFile(filePath, 'en_US', component);
        });
        util.walkSync(path.join(localeFolder, 'ro_RO'), ['.po'], function (filePath) {
            translation.loadLanguageFile(filePath, 'ro_RO', component);
        });

        it('must translate if message id exists', function () {
            expect(translation.translate(component, 'Send email')).toEqual('Trimite email');
        });

        it('must return the message id, if translation doesn\'t exist', function () {
            expect(translation.translate(component, 'No translation')).toEqual('No translation');
        });

        it('must correctly resolve arguments', function () {
            expect(translation.translate(component, 'Dear %1$s %2$s,', undefined, undefined, ['Jhon', 'Doe'])).toEqual('Bună ziua domnule Doe,');
        });
    });

    describe('Testing locale function', function() {
        var translation, transInstance;
        beforeEach(function() {
            translation = getModule('/lib/translation.js');
            transInstance = new translation.Translation();
        });

        it('must throw an rain error if the component parameter is missing', function() {
            expect(function() {
                transInstance.getLocale();
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'component');
        });

        it('must throw an rain error if the locale parameter is missing', function() {
            expect(function() {
                transInstance.getLocale({});
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'locale');
        });

        it('must return an empty object cause no translation is existing', function() {
            expect(transInstance.getLocale(1, 2)).toEqual({});
        });

        it('must return the domain and data object of a locale', function() {
            translation.locales['test 1.0'] = {
                'de': {
                    textdomain: function() { return "textdomain"; },
                    options: { locale_data: "translations" }
                }
            };

            //TODO find a way to mock private functions
            spyOn(translation, 'computeLocaleId');
            var translationResult = transInstance.getLocale({
                id: 'test', version: '1.0'
            }, 'de');


            expect(translationResult.domain).toEqual("textdomain");
            expect(translationResult.data).toEqual("translations");
        });
    });

    describe('Testing locales function', function() {
        var translation, transInstance;
        beforeEach(function() {
            translation = getModule('/lib/translation.js');
            transInstance = new translation.Translation();
        });

        it('must throw an rain error if the component parameter is missing', function() {
            expect(function() {
                transInstance.getLocales();
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'component');
        });

        it('must return 1 language cause defaultLanguage is the same', function() {
            spyOn(transInstance, 'getLocale').andReturn("something");
            translation.configuration.language = 'en_US';
            translation.configuration.defaultLanguage = 'en_US';
            var transResult = transInstance.getLocales({});

            expect(transInstance.getLocale).toHaveBeenCalled();
            expect(transResult).toEqual({language: 'something'});
        });

        it('must return both languages', function() {
            spyOn(transInstance, 'getLocale').andReturn("something");
            translation.configuration.language = 'en_US';
            translation.configuration.defaultLanguage = 'en_UK';
            var transResult = transInstance.getLocales({});

            expect(transInstance.getLocale).toHaveBeenCalled();
            expect(transResult).toEqual({language: 'something', defaultLanguage:'something'});
        });
    });
});

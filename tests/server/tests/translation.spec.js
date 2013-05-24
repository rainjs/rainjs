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

describe("Server Side Translation", function () {
    var mocks = {},
        fs, configuration, Translation, poUtils,
        file, component, locale, jed, Jed;

    beforeEach(function () {

        file = 'fake.po';
        component = {
            id: 'fakeId',
        };
        locale = 'ro_RO';


        fs = jasmine.createSpyObj('fs', ['readFileSync']);
        fs.readFileSync.andCallFake(function () {
            var data = "msgid 'a.b.c' \n msgstr 'Some text'";
            return data;
        })
        mocks['fs'] = fs;

        configuration = {
            defaultLanguage: 'en_EN',
            language: 'ro_RO'
        };
        mocks['./configuration'] = configuration;

        poUtils = jasmine.createSpyObj('poUtils', ['parsePo']);
        poUtils.parsePo.andCallFake(function () {
            return {};
        });
        mocks['./po_utils'] = poUtils;

        jed = {
            translate: jasmine.createSpy('translate'),
            textdomain: jasmine.createSpy('textdomain'),
            pluralFormFn: jasmine.createSpy('pluralFormFn'),
            options: {
                locale_data: {

                },
                domain: {

                }
            }
        }
        jed.textdomain.andCallFake(function () {
            return this.options.domain;
        })
        Jed = jasmine.createSpy('Jed');
        Jed.PF  = {
            compile: jasmine.createSpy('compile')
        }

        Jed.andCallFake(function (config) {
            jed.options.locale_data = config.locale_data;
            jed.options.domain = config.domain;
            return jed;
        });

        mocks['jed'] = {
            Jed: Jed
        };

        Translation = loadModuleExports('/lib/translation.js', mocks);

    });

    describe("Singleton method", function () {

        it('should construct the object only once', function () {

            var translationInstance1 = Translation.get();
            var translationInstance2 = Translation.get();

            expect(translationInstance1).toBe(translationInstance2);

        });

    });

    describe("loadLanguageFile method", function () {

        it('should throw an ERROR_IO error if the file could not have been read', function () {

            fs.readFileSync.andCallFake(function () {
                throw new Error('fail');
            });

            var translationInstance = Translation.get();

            expect(function() {translationInstance.loadLanguageFile(); }).toThrowType(RainError.ERROR_IO);

        });

        it('should throw an ERROR_PRECONDITION_FAILED if the locale parameter is missing', function () {

            var translationInstance = Translation.get();
            expect(function () {translationInstance.loadLanguageFile('myFile');}).toThrowType(
                RainError.ERROR_PRECONDITION_FAILED);

        });

        it('should set the private locales with the components id and locale', function () {

            var translationInstance = Translation.get();

            translationInstance.loadLanguageFile(file, locale, component);

            expect(translationInstance._locales[component.id + ' ' + component.version]
                [locale]).toEqual(jasmine.any(Object));
        });

    });

    describe("getLocales method", function () {

        it('should correctly get the locales for a component', function () {
            var translationInstance = Translation.get();

            translationInstance.loadLanguageFile(file, locale, component);

            var localesForComponent = translationInstance.getLocales(component, locale);
            expect(localesForComponent.language.domain).toBe('fake');
            expect(localesForComponent.language.data).toEqual(jasmine.any(Object));
        });

    });

    describe("generateContext method", function () {

        it('should generate the context correctly', function () {

            Translation.prototype.translate = jasmine.createSpy('translate');
            var translationInstance = Translation.get();

            var context = translationInstance.generateContext(component, locale);

            context.t('someCustomId');
            context.nt('someCustomId');

            expect(translationInstance.translate).toHaveBeenCalled();
            expect(translationInstance.translate.callCount).toBe(2);
        });

    });

    describe("translate method", function () {

    });
});

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

var path = require('path');

describe('generate po utils', function () {
    var GeneratePoUtils, utils, fs, util,
        locale = {
            "": {
                header1: 'header 1',
                header2: 'header 2'
            },
            "Some translation": [null, "Some translation"],
            "Some other message": ['Plural id', "Some other message", "Plural message"]
        };

    beforeEach(function () {
        var mocks = {};
        fs = mocks['fs'] = jasmine.createSpyObj('fs', ['readdirSync', 'statSync', 'readFileSync', 'writeFileSync']);
        util = mocks['../../lib/util'] = jasmine.createSpyObj('util', ['walkSync']);
        mocks['wrench'] = jasmine.createSpyObj('wrench', ['mkdirSyncRecursive']);
        GeneratePoUtils = loadModuleExports('bin/lib/generate_po_utils.js', mocks);
        utils = new GeneratePoUtils();
    });

    describe('merge translations', function () {
        var component, po, tr;

        describe('compare translations', function () {

            beforeEach(function () {
                spyOn(utils, 'updateExistingTranslations');
                spyOn(utils, 'addNewTranslations');
            });

            it('should merge translations', function () {
                component = {};
                po = {};
                tr = {};

                utils.compareTranslations(component, po, tr);

                expect(utils.updateExistingTranslations).toHaveBeenCalledWith(po, tr);
                expect(utils.addNewTranslations).toHaveBeenCalledWith(component, po, tr);
            });

        });

        describe('update existing translations', function () {

            beforeEach(function () {
                spyOn(utils, 'searchParsedTranslation');
            });

            describe('one-to-one', function () {

                it('should delete missing entries', function () {
                    po = { 'ro': { 'hello, world': [null, 'salut, lume'] } };
                    tr = { 'test': {} };

                    utils.searchParsedTranslation.andReturn('');
                    utils.updateExistingTranslations(po, tr);

                    expect(po.ro['hello, world']).not.toBeDefined();
                });

                it('should keep old entries', function () {
                    po = { 'ro': { 'hello, world': [null, 'salut, lume'] } };
                    tr = { 'test': ['hello, world'] };

                    utils.searchParsedTranslation.andReturn(tr.test[0]);
                    utils.updateExistingTranslations(po, tr);

                    expect(po.ro['hello, world']).toBeDefined();
                });

                it('should update entries', function () {
                    po = { 'ro': { 'error': [null, 'eroare'] } };
                    tr = { 'test': [['error', 'errors']] };

                    utils.searchParsedTranslation.andReturn(tr.test[0]);
                    utils.updateExistingTranslations(po, tr);

                    expect(po.ro.error).toBeDefined();
                    expect(po.ro.error[0]).toEqual(tr.test[0][1]);
                });

                it('should ignore header entries', function () {
                    po = { 'ro': { '': { 'header-key': 'header-value' }, 'hello, world': [null, 'salut, lume'] } };
                    tr = { 'test': ['hello, world'] };

                    utils.searchParsedTranslation.andReturn(tr.test[0]);
                    utils.updateExistingTranslations(po, tr);

                    expect(po.ro['']).toBeDefined();
                    expect(po.ro['hello, world']).toBeDefined();
                });

            });

            describe('many-to-many', function () {

                it('should delete missing entries', function () {
                    po = {
                        'ro': { 'hello, world': [null, 'salut, lume'] },
                        'en': { 'hello, world': [null, 'hello, world'] }
                    };
                    tr = {
                        'one': {},
                        'two': {}
                    };

                    utils.searchParsedTranslation.andReturn('');
                    utils.updateExistingTranslations(po, tr);

                    expect(po.ro['hello, world']).not.toBeDefined();
                    expect(po.en['hello, world']).not.toBeDefined();
                });

                it('should keep old entries', function () {
                    po = {
                        'ro': { 'hello, world': [null, 'salut, lume'] },
                        'en': { 'hello, world': [null, 'hello, world'] }
                    };
                    tr = {
                        'one': [],
                        'two': ['hello, world']
                    };

                    utils.searchParsedTranslation.andReturn(tr.two[0]);
                    utils.updateExistingTranslations(po, tr);

                    expect(po.ro['hello, world']).toBeDefined();
                    expect(po.en['hello, world']).toBeDefined();
                });

                it('should update entries', function () {
                    po = {
                        'ro': { 'error': [null, 'eroare'] },
                        'en': { 'error': [null, 'error'] }
                    };
                    tr = {
                        'one': [['error', 'errors']],
                        'two': []
                    };

                    utils.searchParsedTranslation.andReturn(tr.one[0]);
                    utils.updateExistingTranslations(po, tr);

                    expect(po.ro.error).toBeDefined();
                    expect(po.ro.error[0]).toEqual(tr.one[0][1]);
                    expect(po.en.error).toBeDefined();
                    expect(po.en.error[0]).toEqual(tr.one[0][1]);
                });

                it('should ignore header entries', function () {
                    po = {
                        'ro': { '': { 'header-key': 'header-value' }, 'hello, world': [null, 'salut, lume'] },
                        'en': { '': { 'header-key': 'header-value' }, 'hello, world': [null, 'hello, world'] }
                    };
                    tr = {
                        'one': ['hello, world'],
                        'two': []
                    };

                    utils.searchParsedTranslation.andReturn(tr.one[0]);
                    utils.updateExistingTranslations(po, tr);

                    expect(po.ro['']).toBeDefined();
                    expect(po.ro['hello, world']).toBeDefined();
                    expect(po.en['']).toBeDefined();
                    expect(po.en['hello, world']).toBeDefined();
                });

                it('should handle a complex case', function () {
                    po = {
                        'ro': {
                            '': { 'header-key': 'header-value' },
                            'hello, world': [null, 'salut, lume'],
                            'hello': [null, 'salut'],
                            'goodbye': [null, 'la revedere'],
                            'error': [null, 'eroare'],
                            'event': [null, 'eveniment']
                        },
                        'en': {
                            '': { 'header-key': 'header-value' },
                            'hello, world': [null, 'hello, world'],
                            'goodbye': [null, 'goodbye'],
                            'error': [null, 'error'],
                            'event': ['events', 'event']
                        }
                    };
                    tr = {
                        'one': [
                            'hello, world',
                            ['error', 'errors']
                        ],
                        'two': [
                            ['event', 'more events'],
                            'goodbye'
                        ]
                    };

                    utils.searchParsedTranslation.andCallFake(function (tr, id) {
                        for (var file in tr) {
                            for (var i = 0, l = tr[file].length; i < l; i++) {
                                var entry = tr[file][i];
                                if ((Array.isArray(entry) && entry[0] && id === entry[0]) || id === entry) {
                                    return entry;
                                }
                            }
                        }

                        return '';
                    });
                    utils.updateExistingTranslations(po, tr);

                    expect(po.ro['']).toBeDefined();
                    expect(po.ro['hello, world']).toBeDefined();
                    expect(po.ro['hello']).not.toBeDefined();
                    expect(po.ro['goodbye']).toBeDefined();
                    expect(po.ro['error']).toBeDefined();
                    expect(po.ro['error'][0]).toEqual('errors');
                    expect(po.ro['event']).toBeDefined();
                    expect(po.ro['event'][0]).toEqual(tr.two[0][1]);
                    expect(po.en['']).toBeDefined();
                    expect(po.en['hello, world']).toBeDefined();
                    expect(po.en['goodbye']).toBeDefined();
                    expect(po.en['error']).toBeDefined();
                    expect(po.en['error'][0]).toEqual('errors');
                    expect(po.en['event']).toBeDefined();
                    expect(po.en['event'][0]).toEqual('events');
                });

            });

        });

        describe('search parsed translations', function () {
            var found;

            beforeEach(function () {
                tr = {
                    'one': [['error', 'errors']],
                    'two': ['hello, world']
                };
            });

            it('should find singular entries', function () {
                found = utils.searchParsedTranslation(tr, 'hello, world');
                expect(found).toBe(tr.two[0]);
            });

            it('should find plural entries', function () {
                found = utils.searchParsedTranslation(tr, 'error');
                expect(found).toBe(tr.one[0]);
            });

        });

        describe('add new translations', function () {
            var ro, en;

            beforeEach(function () {
                component = { folder: path.join('components', 'x') };
                ro = path.join('components', 'x', 'locale', 'ro', 'messages.po');
                en = path.join('components', 'x', 'locale', 'en', 'messages.po');

                spyOn(utils, '__searchPoTranslation');
            });

            describe('one-to-one', function () {

                beforeEach(function () {
                    utils._searchPoTranslation.andReturn(void 0);
                });

                it('should add one new singular entry', function () {
                    po = {}; po[ro] = { 'hello': [null, 'salut'] };
                    tr = { 'one': ['goodbye'] };

                    utils.addNewTranslations(component, po, tr);

                    expect(po[ro]['goodbye'][0]).toBeNull();
                    expect(po[ro]['goodbye'][1]).toEqual('goodbye');
                });

                it('should add multiple singular entries', function () {
                    po = {}; po[ro] = { 'hello': [null, 'salut'] };
                    tr = { 'one': ['goodbye', 'error'] };

                    utils.addNewTranslations(component, po, tr);

                    expect(po[ro]['goodbye'][0]).toBeNull();
                    expect(po[ro]['goodbye'][1]).toEqual('goodbye');
                    expect(po[ro]['error'][0]).toBeNull();
                    expect(po[ro]['error'][1]).toEqual('error');
                });

                it('should add one new plural entry', function () {
                    po = {}; po[ro] = { 'hello': [null, 'salut'] };
                    tr = { 'one': [['error', 'errors']] };

                    utils.addNewTranslations(component, po, tr);

                    expect(po[ro]['error'][0]).toEqual('errors');
                    expect(po[ro]['error'][1]).toEqual('error');
                });

                it('should add multiple plural entries', function () {
                    po = {}; po[ro] = { 'hello': [null, 'salut'] };
                    tr = { 'one': [['error', 'errors'], ['event', 'events']] };

                    utils.addNewTranslations(component, po, tr);

                    expect(po[ro]['error'][0]).toEqual('errors');
                    expect(po[ro]['error'][1]).toEqual('error');
                    expect(po[ro]['event'][0]).toEqual('events');
                    expect(po[ro]['event'][1]).toEqual('event');
                });
            });

            describe('many-to-many', function () {

                beforeEach(function () {
                    utils._searchPoTranslation.andCallFake(function (po, id) {
                        for (var locale in po) {
                            var entry = po[locale][id];
                            if (entry) {
                                return entry;
                            }
                        }
                    });
                });

                it('should add one new singular entry to multiple locales', function () {
                    po = {}; po[ro] = {}; po[en] = {};
                    tr = { 'one': ['hello'] };

                    utils.addNewTranslations(component, po, tr);

                    expect(po[ro]['hello'][0]).toBeNull();
                    expect(po[ro]['hello'][1]).toEqual('hello');
                    expect(po[en]['hello'][0]).toBeNull();
                    expect(po[en]['hello'][1]).toEqual('hello');
                });

                it('should add multiple singular entries to multiple locales', function () {
                    po = {}; po[ro] = {}; po[en] = {};
                    tr = {
                        'one': ['hello'],
                        'two': ['error']
                    };

                    utils.addNewTranslations(component, po, tr);

                    expect(po[ro]['hello'][0]).toBeNull();
                    expect(po[ro]['hello'][1]).toEqual('hello');
                    expect(po[en]['hello'][0]).toBeNull();
                    expect(po[en]['hello'][1]).toEqual('hello');

                    expect(po[ro]['error'][0]).toBeNull();
                    expect(po[ro]['error'][1]).toEqual('error');
                    expect(po[en]['error'][0]).toBeNull();
                    expect(po[en]['error'][1]).toEqual('error');

                });

                it('should add multiple plural entries to multiple locales', function () {
                    po = {}; po[ro] = {}; po[en] = {};
                    tr = {
                        'one': [['error', 'errors']],
                        'two': [['event', 'events']]
                    };

                    utils.addNewTranslations(component, po, tr);

                    expect(po[ro]['error'][0]).toEqual('errors');
                    expect(po[ro]['error'][1]).toEqual('error');
                    expect(po[en]['error'][0]).toEqual('errors');
                    expect(po[en]['error'][1]).toEqual('error');

                    expect(po[ro]['event'][0]).toEqual('events');
                    expect(po[ro]['event'][1]).toEqual('event');
                    expect(po[en]['event'][0]).toEqual('events');
                    expect(po[en]['event'][1]).toEqual('event');

                });

                it('should handle a complex case', function () {
                    var ro_other = path.join('components', 'x', 'locale', 'ro', 'misc.po');

                    po = {};
                    po[ro] = {
                        'hello': [null, 'salut'],
                    };
                    po[ro_other] = {
                        'goodbye': [null, 'la revedere']
                    };
                    po[en] = {
                        'hello': [null, 'hello'],
                        'goodbye': [null, 'goodbye']
                    };
                    tr = {
                        'one': ['error', ['option', 'options']],
                        'two': ['goodbye', ['event', 'events']],
                        'three': ['hello']
                    };

                    utils.addNewTranslations(component, po, tr);

                    expect(po[ro]['hello'][0]).toBeNull();
                    expect(po[ro]['hello'][1]).toEqual('salut');
                    expect(po[ro_other]['hello']).not.toBeDefined();
                    expect(po[en]['hello'][0]).toBeNull();
                    expect(po[en]['hello'][1]).toEqual('hello');

                    expect(po[ro]['error'][0]).toBeNull();
                    expect(po[ro]['error'][1]).toEqual('error');
                    expect(po[ro_other]['error']).not.toBeDefined();
                    expect(po[en]['error'][0]).toBeNull();
                    expect(po[en]['error'][1]).toEqual('error');

                    expect(po[ro]['option'][0]).toEqual('options');
                    expect(po[ro]['option'][1]).toEqual('option');
                    expect(po[ro_other]['option']).not.toBeDefined();
                    expect(po[en]['option'][0]).toEqual('options');
                    expect(po[en]['option'][1]).toEqual('option');

                    expect(po[ro]['goodbye']).not.toBeDefined();
                    expect(po[ro_other]['goodbye'][0]).toBeNull();
                    expect(po[ro_other]['goodbye'][1]).toEqual('la revedere');
                    expect(po[en]['goodbye'][0]).toBeNull();
                    expect(po[en]['goodbye'][1]).toEqual('goodbye');

                    expect(po[ro]['event'][0]).toEqual('events');
                    expect(po[ro]['event'][1]).toEqual('event');
                    expect(po[ro_other]['event']).not.toBeDefined();
                    expect(po[en]['event'][0]).toEqual('events');
                    expect(po[en]['event'][1]).toEqual('event');
                });

            });
        });

        describe('search po translations', function () {
            var found;

            beforeEach(function () {
                po = {
                    'ro': { 'hello': [null, 'salut'], 'goodbye': [null, 'la revedere'] },
                    'en': { 'welcome': [null, 'bine ați venit'] }
                };
            });

            it('should find existing message ids', function () {
                found = utils._searchPoTranslation(po, 'goodbye');

                expect(found).toBe(po.ro.goodbye);

                found = utils._searchPoTranslation(po, 'welcome');

                expect(found).toBe(po.en.welcome);
            });

            it('should return undefined for missing message ids', function () {
                found = utils._searchPoTranslation(po, 'hello, world');

                expect(found).toBeUndefined();
            });

        });

    });

    describe('scanComponents', function () {
        beforeEach(function () {
            fs.statSync.andReturn({ isDirectory: function () { return true; } });
        });

        it('should return a list of component configs', function () {
            fs.readdirSync.andReturn(['button', 'example']);
            fs.readFileSync.andCallFake(function (file) {
                // on windows, path separators are treated as escape characters in JSON
                return '{"file": "' + file.replace(/\\/g, '\\\\') + '"}';
            });

            var components = utils.scanComponents('components');

            var component1 = {
                file: path.join('components', 'button', 'meta.json'),
                folder: path.join('components', 'button')
            };
            var component2 = {
                file: path.join('components', 'example', 'meta.json'),
                folder: path.join('components', 'example')
            };

            expect(components).toEqual([component1, component2]);
            expect(fs.readdirSync).toHaveBeenCalledWith('components');
            expect(fs.readFileSync).toHaveBeenCalledWith(
                path.join('components', 'button', 'meta.json'), 'utf8');
            expect(fs.readFileSync).toHaveBeenCalledWith(
                path.join('components', 'example', 'meta.json'), 'utf8');
        });

        it('should throw if the component folder does not exist', function () {
            fs.readdirSync.andThrow(new Error('some error'));

            expect(function () {
                utils.scanComponents('components');
            }).toThrow();
        });
    });

    describe('parseComponent', function () {
        beforeEach(function () {
            spyOn(utils, 'parseTemplateFiles');
            spyOn(utils, 'parseJsFiles');
        });

        it('should invoke the parse methods and return the result', function () {
            utils.parseTemplateFiles.andReturn({a: 1, b: 2});
            utils.parseJsFiles.andReturn({c: 3});

            var translations = utils.parseComponent({});

            expect(translations).toEqual({a: 1, b: 2, c: 3});
        });
    });

    describe('parseTemplateFiles', function () {
        beforeEach(function () {
            spyOn(utils, 'parseFiles');
        });

        it('should call parse for template files', function () {
            utils.parseFiles.andReturn('value');

            expect(utils.parseTemplateFiles({folder: '/components/button'})).toEqual('value');

            expect(utils.parseFiles).toHaveBeenCalledWith({
                folder: path.join('/components/button', 'client/templates'),
                extensions: ['.html'],
                tPattern: jasmine.any(Object),
                ntPattern: jasmine.any(Object)
            });
        });
    });

    describe('parseJsFiles', function () {
        beforeEach(function () {
            spyOn(utils, 'parseFiles');
        });

        it('should call parse for js files', function () {
            utils.parseFiles.andReturn('value');

            expect(utils.parseJsFiles({folder: '/components/button'})).toEqual('value');

            expect(utils.parseFiles).toHaveBeenCalledWith({
                folder: path.join('/components/button', 'client/js'),
                extensions: ['.js'],
                tPattern: jasmine.any(Object),
                ntPattern: jasmine.any(Object)
            });

            expect(utils.parseFiles).toHaveBeenCalledWith({
                folder: path.join('/components/button', 'server'),
                extensions: ['.js'],
                tPattern: jasmine.any(Object),
                ntPattern: jasmine.any(Object)
            });
        });
    });

    describe('parseFiles', function () {
        it('should parse js files', function () {
            util.walkSync.andCallFake(function (folder, extensions, cb) {
                cb('file1');
                cb('file2');
            });

            fs.readFileSync.andCallFake(function (file) {
                if (file === 'file1') {
                    return "for (var i = 0; i < 3; i++) {\n" +
                            "   console.log(t( \"abc\"));\n" +
                            "}\n" +
                            "\n" +
                            "button.label =nt('new', 'new plural', 2, [1, 3]);";
                }

                if (file === 'file2') {
                    return "if (i === 0) {" +
                            "  return t ('message' );" +
                            "} else {" +
                            "  component.text = t(" +
                            "      'some text');";
                }
            });

            var messages = utils.parseJsFiles({folder: '/components/button'});

            expect(messages['file1']).toEqual(['abc', ['new', 'new plural']]);
            expect(messages['file2']).toEqual(['message', 'some text']);
        });

        it('should parse template files', function () {
            util.walkSync.andCallFake(function (folder, extensions, cb) {
                cb('template1');
                cb('template2');
            });

            fs.readFileSync.andCallFake(function (file) {
                if (file === 'template1') {
                    return '{{t "some message"}}';
                }

                if (file === 'template2') {
                    return '{{nt "singular" "plural" n n var }}';
                }
            });

            var messages = utils.parseTemplateFiles({folder: '/components/button'});

            expect(messages['template1']).toEqual(['some message']);
            expect(messages['template2']).toEqual([['singular', 'plural']]);
        });
    });

    describe("write translation files", function() {
        it("should corectly generate the translation", function() {
            var translation = new GeneratePoUtils();

            expect(translation._composePoContent(locale)).toEqual(
                'msgid ""\n' +
                'msgstr ""\n' +
                '"header1: header 1\\n"\n' +
                '"header2: header 2\\n"\n\n' +

                'msgid "Some translation"\n' +
                'msgstr "Some translation"\n\n' +

                'msgid "Some other message"\n' +
                'msgid_plural "Plural id"\n' +
                'msgstr[0] "Some other message"\n' +
                'msgstr[1] "Plural message"\n'
            );
        });

        it('should try to write the translation to the file', function () {
            var translation = new GeneratePoUtils();
            var generatedText =
                'msgid ""\n' +
                'msgstr ""\n' +
                '"header1: header 1\\n"\n' +
                '"header2: header 2\\n"\n\n' +

                'msgid "Some translation"\n' +
                'msgstr "Some translation"\n\n' +

                'msgid "Some other message"\n' +
                'msgid_plural "Plural id"\n' +
                'msgstr[0] "Some other message"\n' +
                'msgstr[1] "Plural message"\n';

            var component = {
                id: 'component',
                version: '1.0',
                views: { index: {} },
                folder: '/component/path'
            };

            var poTranslations = {
                '/some/path': {
                    '': {
                        'Content-Type': 'text/plain; charset=UTF-8',
                        'Plural-Forms': 'nplurals=2; plural=(n != 1);'
                    },
                    'Some message': [ null, 'Some message' ]
                }
            };

            spyOn(translation, '__composePoContent').andReturn(generatedText);

            translation.createPoFiles(component, poTranslations);

            expect(fs.writeFileSync).toHaveBeenCalledWith('/some/path', generatedText, 'utf8');
        });

        it('shouldn\'t do anything if the file doesn\'t have any messages', function () {
            var translation = new GeneratePoUtils();
            var generatedText =
                'msgid ""\n' +
                'msgstr ""\n' +
                '"header1: header 1\\n"\n' +
                '"header2: header 2\\n"\n\n' +

                'msgid "Some translation"\n' +
                'msgstr "Some translation"\n\n' +

                'msgid "Some other message"\n' +
                'msgid_plural "Plural id"\n' +
                'msgstr[0] "Some other message"\n' +
                'msgstr[1] "Plural message"\n';

            var component = {
                id: 'component',
                version: '1.0',
                views: { index: {} },
                folder: '/component/path'
            };

            var poTranslations = {
                '/some/path': {
                    '': {
                        'Content-Type': 'text/plain; charset=UTF-8',
                        'Plural-Forms': 'nplurals=2; plural=(n != 1);'
                    }
                }
            };

            spyOn(translation, '__composePoContent').andReturn(generatedText);
            translation.createPoFiles(component, poTranslations);

            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });
    });
});

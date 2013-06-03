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
                spyOn(utils, '_updateExistingTranslations');
                spyOn(utils, '_addNewTranslations');
            });

            it('should merge translations', function () {
                component = {};
                po = {};
                tr = {};

                utils._updateTranslations(component, po, tr);

                expect(utils._updateExistingTranslations).toHaveBeenCalledWith(po, tr);
                expect(utils._addNewTranslations).toHaveBeenCalledWith(component, po, tr);
            });

        });

        describe('update existing translations', function () {

            describe('one-to-one', function () {

                it('should delete missing entries', function () {
                    po = { 'ro': { 'hello, world': [null, 'salut, lume'] } };
                    tr = { 'test': [] };

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro['hello, world']).not.toBeDefined();
                });

                it('should keep old entries', function () {
                    po = { 'ro': { 'hello, world': [null, 'salut, lume'] } };
                    tr = { 'test': [{msgid: 'hello, world'}] };

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro['hello, world']).toBeDefined();
                });

                it('should keep old entries when custom id is present', function () {
                    po = { 'ro': { 'custom.id': [null, 'salut, lume'] } };
                    tr = { 'test': [{msgid: 'hello, world', id: 'custom.id'}] };

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro['custom.id']).toBeDefined();
                });


                it('should update entries', function () {
                    po = { 'ro': { 'error': [null, 'eroare'] } };
                    tr = { 'test': [{msgid: 'error', msgidPlural: 'errors'}] };

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro.error).toBeDefined();

                    expect(po.ro.error[0]).toEqual(tr.test[0].msgidPlural);
                });

                it('should update entries when custom id is present', function () {
                    po = { 'ro': { 'custom.id': [null, 'eroare'] } };
                    tr = { 'test': [{msgid: 'error', msgidPlural: 'errors', id: "custom.id"}] };

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro['custom.id']).toBeDefined();

                    expect(po.ro['custom.id'][0]).toEqual(tr.test[0].msgidPlural);
                });

                it('should ignore header entries', function () {
                    po = { 'ro': { '': { 'header-key': 'header-value' }, 'hello, world': [null, 'salut, lume'] } };
                    tr = { 'test': [{msgid: 'hello, world'}] };

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro['']).toBeDefined();
                    expect(po.ro['hello, world']).toBeDefined();
                });

                it('should ignore header entries when custom id is present', function () {
                    po = { 'ro': { '': { 'header-key': 'header-value' }, 'custom.id': [null, 'salut, lume'] } };
                    tr = { 'test': [{msgid: 'hello, world', id: 'custom.id'}] };

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro['']).toBeDefined();
                    expect(po.ro['custom.id']).toBeDefined();
                });

            });

            describe('many-to-many', function () {

                it('should delete missing entries', function () {
                    po = {
                        'ro': { 'hello, world': [null, 'salut, lume'] },
                        'en': { 'hello, world': [null, 'hello, world'] }
                    };
                    tr = {};

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro['hello, world']).not.toBeDefined();
                    expect(po.en['hello, world']).not.toBeDefined();
                });

                it('should keep old entries', function () {
                    po = {
                        'ro': { 'hello, world': [null, 'salut, lume'] },
                        'en': { 'hello, world': [null, 'hello, world'] }
                    };
                    tr = {
                        'two': [{msgid: 'hello, world'}]
                    };

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro['hello, world']).toBeDefined();
                    expect(po.en['hello, world']).toBeDefined();
                });

                it('should update entries', function () {
                    po = {
                        'ro': { 'error': [null, 'eroare'] },
                        'en': { 'error': [null, 'error'] }
                    };
                    tr = {
                        'one': [{msgid: 'error', msgidPlural: 'errors'}],
                    };

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro.error).toBeDefined();
                    expect(po.ro.error[0]).toEqual(tr.one[0].msgidPlural);
                    expect(po.en.error).toBeDefined();
                    expect(po.en.error[0]).toEqual(tr.one[0].msgidPlural);
                });

                it('should update entries when custom id is present', function () {
                    po = {
                        'ro': { 'custom.id': [null, 'eroare'] },
                        'en': { 'custom.id': [null, 'error'] }
                    };
                    tr = {
                        'one': [{msgid: 'error', msgidPlural: 'errors', id: 'custom.id'}],
                    };

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro['custom.id']).toBeDefined();
                    expect(po.ro['custom.id'][0]).toEqual(tr.one[0].msgidPlural);
                    expect(po.en['custom.id']).toBeDefined();
                    expect(po.en['custom.id'][0]).toEqual(tr.one[0].msgidPlural);
                });

                it('should ignore header entries', function () {
                    po = {
                        'ro': { '': { 'header-key': 'header-value' }, 'hello, world': [null, 'salut, lume'] },
                        'en': { '': { 'header-key': 'header-value' }, 'hello, world': [null, 'hello, world'] }
                    };
                    tr = {
                        'one': [{msgid: 'hello, world'}],
                    };

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro['']).toBeDefined();
                    expect(po.ro['hello, world']).toBeDefined();
                    expect(po.en['']).toBeDefined();
                    expect(po.en['hello, world']).toBeDefined();
                });

                it('should ignore header entries when custom id is present', function () {
                    po = {
                        'ro': { '': { 'header-key': 'header-value' }, 'custom.id': [null, 'salut, lume'] },
                        'en': { '': { 'header-key': 'header-value' }, 'custom.id': [null, 'hello, world'] }
                    };
                    tr = {
                        'one': [{msgid: 'hello, world', id: 'custom.id'}],
                    };

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro['']).toBeDefined();
                    expect(po.ro['custom.id']).toBeDefined();
                    expect(po.en['']).toBeDefined();
                    expect(po.en['custom.id']).toBeDefined();
                });

                it('should handle a complex case', function () {
                    po = {
                        'ro': {
                            '': { 'header-key': 'header-value' },
                            'hello, world': [null, 'salut, lume'],
                            'hello': [null, 'salut'],
                            'goodbye': [null, 'la revedere'],
                            'error': [null, 'eroare'],
                            'event': [null, 'eveniment'],
                            'custom.id.code': [null, 'cod'],
                            'custom.id.morning': [null, 'dimineata']
                        },
                        'en': {
                            '': { 'header-key': 'header-value' },
                            'hello, world': [null, 'hello, world'],
                            'goodbye': [null, 'goodbye'],
                            'error': [null, 'error'],
                            'event': ['events', 'event'],
                            'custom.id.code': ['codes', 'code'],
                            'custom.id.morning': [null, 'morning']
                        }
                    };
                    tr = {
                        'one': [
                            {msgid: 'hello, world'},
                            {msgid: 'error', msgidPlural: 'errors'}
                        ],
                        'two': [
                            {msgid: 'event', msgidPlural: 'more events'},
                            {msgid: 'goodbye'}
                        ],
                        'three': [
                            {msgid: 'code', msgidPlural: 'more codes', id: 'custom.id.code'},
                            {msgid: 'morning', id: 'custom.id.morning'}
                        ]
                    };

                    utils._updateExistingTranslations(po, tr);

                    expect(po.ro['']).toBeDefined();
                    expect(po.ro['hello, world']).toBeDefined();
                    expect(po.ro['hello']).not.toBeDefined();
                    expect(po.ro['goodbye']).toBeDefined();
                    expect(po.ro['error']).toBeDefined();
                    expect(po.ro['error'][0]).toEqual('errors');
                    expect(po.ro['event']).toBeDefined();
                    expect(po.ro['event'][0]).toEqual(tr.two[0].msgidPlural);
                    expect(po.ro['custom.id.morning']).toBeDefined();
                    expect(po.ro['custom.id.code'][0]).toEqual(tr.three[0].msgidPlural);

                    expect(po.en['']).toBeDefined();
                    expect(po.en['hello, world']).toBeDefined();
                    expect(po.en['goodbye']).toBeDefined();
                    expect(po.en['error']).toBeDefined();
                    expect(po.en['error'][0]).toEqual('errors');
                    expect(po.en['event']).toBeDefined();
                    expect(po.en['event'][0]).toEqual(tr.two[0].msgidPlural);
                    expect(po.en['custom.id.morning']).toBeDefined();
                    expect(po.en['custom.id.morning'][0]).toBeUndefined();
                    expect(po.en['custom.id.code'][0]).toEqual(tr.three[0].msgidPlural);

                });

            });

        });

        describe('search parsed translations', function () {
            var found;

            beforeEach(function () {
                tr = {
                    'one': [{msgid: 'error', msgidPlural: 'errors'}],
                    'two': [{msgid: 'hello, world'}]
                };
            });

            it('should find singular entries', function () {
                found = utils._searchParsedTranslation(tr, 'hello, world');
                expect(found).toBe(tr.two[0]);
            });

            it('should find plural entries', function () {
                found = utils._searchParsedTranslation(tr, 'error');
                expect(found).toBe(tr.one[0]);
            });

        });

        describe('search parsed translations when custom id is present', function () {
            var found;

            beforeEach(function () {
                tr = {
                    'one': [{msgid: 'error', msgidPlural: 'errors', id: 'custom.id.error'}],
                    'two': [{msgid: 'hello, world', id: 'custom.id.hello'}]
                };
            });

            it('should find singular entries', function () {
                found = utils._searchParsedTranslation(tr, 'custom.id.hello');
                expect(found).toBe(tr.two[0]);
            });

            it('should find plural entries', function () {
                found = utils._searchParsedTranslation(tr, 'custom.id.error');
                expect(found).toBe(tr.one[0]);
            });

        });

        describe('add new translations', function () {
            var ro, en;

            beforeEach(function () {
                component = { folder: path.join('components', 'x') };
                ro = path.join('components', 'x', 'locale', 'ro', 'messages.po');
                en = path.join('components', 'x', 'locale', 'en', 'messages.po');
            });

            describe('one-to-one', function () {

                it('should add one new singular entry', function () {
                    po = {};
                    po[ro] = { 'hello': [null, 'salut'] };
                    tr = { 'one': [{msgid: 'goodbye'}] };

                    utils._addNewTranslations(component, po, tr);

                    expect(po[ro]['goodbye'][0]).toBeUndefined();
                    expect(po[ro]['goodbye'][1]).toEqual('goodbye');
                });

                it('should add one new singular entry when custom id is present', function () {
                    po = {};
                    po[ro] = { 'hello': [null, 'salut'] };
                    tr = { 'one': [{msgid: 'goodbye', id: 'custom.id'}] };

                    utils._addNewTranslations(component, po, tr);

                    expect(po[ro]['custom.id'][0]).toBeUndefined();
                    expect(po[ro]['custom.id'][1]).toEqual('goodbye');
                });

                it('should add multiple singular entries', function () {
                    po = {}; po[ro] = { 'hello': [null, 'salut'] };
                    tr = { 'one': [{msgid: 'goodbye'}, {msgid: 'error', id: 'custom.id'}] };

                    utils._addNewTranslations(component, po, tr);

                    expect(po[ro]['goodbye'][0]).toBeUndefined();
                    expect(po[ro]['goodbye'][1]).toEqual('goodbye');
                    expect(po[ro]['custom.id'][0]).toBeUndefined();
                    expect(po[ro]['custom.id'][1]).toEqual('error');
                });

                it('should add one new plural entry', function () {
                    po = {}; po[ro] = { 'hello': [null, 'salut'] };
                    tr = { 'one': [{msgid: 'error', msgidPlural: 'errors', id: 'custom.id'}] };

                    utils._addNewTranslations(component, po, tr);

                    expect(po[ro]['custom.id'][0]).toEqual('errors');
                    expect(po[ro]['custom.id'][1]).toEqual('error');
                });

                it('should add multiple plural entries', function () {
                    po = {}; po[ro] = { 'hello': [null, 'salut'] };
                    tr = { 'one': [
                                    {msgid: 'error', msgidPlural: 'errors'},
                                    {msgid: 'event', msgidPlural: 'events', id: 'custom.id'}
                                  ]
                         };

                    utils._addNewTranslations(component, po, tr);

                    expect(po[ro]['error'][0]).toEqual('errors');
                    expect(po[ro]['error'][1]).toEqual('error');
                    expect(po[ro]['custom.id'][0]).toEqual('events');
                    expect(po[ro]['custom.id'][1]).toEqual('event');
                });

            });

            describe('many-to-many', function () {

                it('should add one new singular entry to multiple locales', function () {
                    po = {}; po[ro] = {}; po[en] = {};
                    tr = { 'one': [{msgid: 'hello'}] };

                    utils._addNewTranslations(component, po, tr);

                    expect(po[ro]['hello'][0]).toBeUndefined();
                    expect(po[ro]['hello'][1]).toEqual('hello');
                    expect(po[en]['hello'][0]).toBeUndefined();
                    expect(po[en]['hello'][1]).toEqual('hello');
                });

                it('should add one new singular entry to multiple locales when custom id is present', function () {
                    po = {}; po[ro] = {}; po[en] = {};
                    tr = { 'one': [{msgid: 'hello', id: 'custom.id'}] };

                    utils._addNewTranslations(component, po, tr);

                    expect(po[ro]['custom.id'][0]).toBeUndefined();
                    expect(po[ro]['custom.id'][1]).toEqual('hello');
                    expect(po[en]['custom.id'][0]).toBeUndefined();
                    expect(po[en]['custom.id'][1]).toEqual('hello');
                });

                it('should add multiple singular entries to multiple locales', function () {
                    po = {}; po[ro] = {}; po[en] = {};
                    tr = {
                        'one': [{msgid: 'hello', id: 'custom.id'}],
                        'two': [{msgid: 'error'}]
                    };

                    utils._addNewTranslations(component, po, tr);

                    expect(po[ro]['custom.id'][0]).toBeUndefined();
                    expect(po[ro]['custom.id'][1]).toEqual('hello');
                    expect(po[en]['custom.id'][0]).toBeUndefined();
                    expect(po[en]['custom.id'][1]).toEqual('hello');

                    expect(po[ro]['error'][0]).toBeUndefined();
                    expect(po[ro]['error'][1]).toEqual('error');
                    expect(po[en]['error'][0]).toBeUndefined();
                    expect(po[en]['error'][1]).toEqual('error');

                });

                it('should add multiple plural entries to multiple locales', function () {
                    po = {}; po[ro] = {}; po[en] = {};
                    tr = {
                        'one': [{msgid: 'error', msgidPlural: 'errors'}],
                        'two': [{msgid: 'event', msgidPlural: 'events', id: 'custom.id.event'}],
                        'three': [{msgid: 'morning', msgidPlural: 'mornings', id: 'custom.id.morning'}]
                    };

                    utils._addNewTranslations(component, po, tr);

                    expect(po[ro]['error'][0]).toEqual('errors');
                    expect(po[ro]['error'][1]).toEqual('error');
                    expect(po[en]['error'][0]).toEqual('errors');
                    expect(po[en]['error'][1]).toEqual('error');

                    expect(po[ro]['custom.id.event'][0]).toEqual('events');
                    expect(po[ro]['custom.id.event'][1]).toEqual('event');
                    expect(po[en]['custom.id.event'][0]).toEqual('events');
                    expect(po[en]['custom.id.event'][1]).toEqual('event');

                    expect(po[ro]['custom.id.morning'][0]).toEqual('mornings');
                    expect(po[ro]['custom.id.morning'][1]).toEqual('morning');
                    expect(po[en]['custom.id.morning'][0]).toEqual('mornings');
                    expect(po[en]['custom.id.morning'][1]).toEqual('morning');

                });

                it('should handle a complex case', function () {
                    var fr = path.join('components', 'x', 'locale', 'fr', 'misc.po');

                    po = {};
                    po[ro] = {
                        'hello': [null, 'salut'],
                    };
                    po[fr] = {
                        'goodbye': [null, 'au revoir'],
                        'morning': ['matins', 'matin'],
                        'custom.id.morning': ['matins', 'matin', 'matins']
                    };
                    po[en] = {
                        'hello': [null, 'hello'],
                        'goodbye': [null, 'goodbye'],
                        'thank you': [null, 'thank you'],
                        'morning': [null, 'morning', 'mornings'],
                        'food': ['foods', 'food', 'foods']
                    };
                    tr = {
                        'one': [{msgid: 'error'}, {msgid: 'option', msgidPlural: 'options'}],
                        'two': [{msgid: 'goodbye'}, {msgid: 'event', msgidPlural: 'events'}],
                        'three': [{msgid: 'hello'}],
                        'four': [{msgid: 'thank you', id: 'custom.id.thank.you'}],
                        'five': [
                                    {msgid: 'goodbye'},
                                    {msgid: 'morning', msgidPlural: 'mornings', id: 'custom.id.morning'}
                                ],
                        'six': [
                                {msgid: 'goodbye', id: 'custom.id.goodbye'},
                                {msgid: 'food', msgidPlural: 'foods', id: 'custom.id.food'}
                        ]
                    };

                    utils._addNewTranslations(component, po, tr);

                    expect(po[ro]['hello'][0]).toBeNull();
                    expect(po[ro]['hello'][1]).toEqual('salut');
                    expect(po[fr]['hello'][1]).toEqual('hello');
                    expect(po[en]['hello'][0]).toBeNull();
                    expect(po[en]['hello'][1]).toEqual('hello');

                    expect(po[ro]['error'][0]).toBeUndefined();
                    expect(po[ro]['error'][1]).toEqual('error');
                    expect(po[fr]['error'][1]).toEqual('error');
                    expect(po[en]['error'][0]).toBeUndefined();
                    expect(po[en]['error'][1]).toEqual('error');

                    expect(po[ro]['option'][0]).toEqual('options');
                    expect(po[ro]['option'][1]).toEqual('option');
                    expect(po[fr]['option'][0]).toEqual('options');
                    expect(po[fr]['option'][1]).toEqual('option');
                    expect(po[en]['option'][0]).toEqual('options');
                    expect(po[en]['option'][1]).toEqual('option');

                    expect(po[ro]['goodbye'][0]).toBeUndefined();
                    expect(po[fr]['goodbye'][0]).toBeNull();
                    expect(po[fr]['goodbye'][1]).toEqual('au revoir');
                    expect(po[en]['goodbye'][0]).toBeNull();
                    expect(po[en]['goodbye'][1]).toEqual('goodbye');

                    expect(po[ro]['event'][0]).toEqual('events');
                    expect(po[ro]['event'][1]).toEqual('event');
                    expect(po[fr]['event'][0]).toEqual('events');
                    expect(po[fr]['event'][1]).toEqual('event');
                    expect(po[en]['event'][0]).toEqual('events');
                    expect(po[en]['event'][1]).toEqual('event');

                    expect(po[ro]['custom.id.thank.you'][0]).toBeUndefined();
                    expect(po[ro]['custom.id.thank.you'][1]).toEqual('thank you');
                    expect(po[fr]['custom.id.thank.you'][0]).toBeUndefined();
                    expect(po[fr]['custom.id.thank.you'][1]).toEqual('thank you');
                    expect(po[en]['custom.id.thank.you'][0]).toBeUndefined();
                    expect(po[en]['custom.id.thank.you'][1]).toEqual('thank you');

                    expect(po[ro]['custom.id.morning'][0]).toEqual('mornings');
                    expect(po[ro]['custom.id.morning'][1]).toEqual('morning');
                    expect(po[fr]['custom.id.morning'][0]).toEqual('matins');
                    expect(po[fr]['custom.id.morning'][1]).toEqual('matin');
                    expect(po[fr]['morning'][0]).toEqual('matins');
                    expect(po[fr]['morning'][1]).toEqual('matin');
                    expect(po[en]['custom.id.morning'][0]).toEqual('mornings');
                    expect(po[en]['custom.id.morning'][1]).toEqual('morning');

                    expect(po[ro]['custom.id.food'][0]).toEqual('foods');
                    expect(po[ro]['custom.id.food'][1]).toEqual('food');

                    expect(po[fr]['custom.id.food'][0]).toEqual('foods');
                    expect(po[fr]['custom.id.food'][1]).toEqual('food');

                    expect(po[en]['custom.id.food'][0]).toEqual('foods');
                    expect(po[en]['custom.id.food'][1]).toEqual('food');
                });
            });
        });
    });

    describe('_scanComponents', function () {
        beforeEach(function () {
            fs.statSync.andReturn({ isDirectory: function () { return true; } });
        });

        it('should return a list of component configs', function () {
            fs.readdirSync.andReturn(['button', 'example']);
            fs.readFileSync.andCallFake(function (file) {
                // on windows, path separators are treated as escape characters in JSON
                return '{"file": "' + file.replace(/\\/g, '\\\\') + '"}';
            });

            var components = utils._scanComponents('components');

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
                utils._scanComponents('components');
            }).toThrow();
        });
    });

    describe('_parseComponent', function () {
        beforeEach(function () {
            spyOn(utils, '_parseTemplateFile');
            spyOn(utils, '_parseJsFile');
        });

        it('should invoke the parse methods and return the result', function () {
            fs.readFileSync.andCallFake(function (file) {
                // on windows, path separators are treated as escape characters in JSON
                return '{"file": "' + file.replace(/\\/g, '\\\\') + '"}';
            });
            utils._parseTemplateFile.andReturn({a: 1, b: 2});
            utils._parseJsFile.andReturn([{c: 3}]);
            util.walkSync.andCallFake(function (folder, extensions, cb) {
                cb('file1.html');
                cb('file2.js');
            });

            var translations = utils._parseComponent({
                folder: 'fakeFolder'
            });

            expect(translations).toEqual({
                'file1.html' : [{c: 3}],
                'file2.js' : [{c: 3}]
            });
        });
    });

    describe('_parseTemplateFile', function () {
        beforeEach(function () {
            spyOn(utils, '_parseFiles');
        });

        it('should call parse for template files with custom id', function () {
            expect(utils._parseTemplateFile('{{t "fakemsgid" id="customid"}}')).toEqual([
                {
                    msgid: 'fakemsgid',
                    msgidPlural: undefined,
                    id: 'customid'
                }
            ]);
        });

        it('should call parse for template files with msg id', function () {
            expect(utils._parseTemplateFile('{{t "hello"}}')).toEqual([
                {
                    msgid: 'hello',
                    msgidPlural: undefined,
                    id: undefined
                }
            ]);
        });
    });

    describe('_parseJsFile', function () {
        beforeEach(function () {
            spyOn(utils, '_parseFiles');
        });

        it('should call parse for js files with custom id', function () {

            expect(utils._parseJsFile(' t("my.custom", "fakemsgid");')).toEqual([
                {
                    id: 'my.custom',
                    msgid : 'fakemsgid'
                }
            ]);

        });

        it('should call parse for js files with msgid', function () {

            expect(utils._parseJsFile(' t("fakemsgid");')).toEqual([
                {
                    msgid : 'fakemsgid'
                }
            ]);

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

            spyOn(translation, '_composePoContent').andReturn(generatedText);

            translation._createPoFiles(component, poTranslations);

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

            spyOn(translation, '_composePoContent').andReturn(generatedText);
            translation._createPoFiles(component, poTranslations);

            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });
    });
});

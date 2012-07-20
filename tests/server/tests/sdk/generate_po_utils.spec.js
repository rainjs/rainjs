describe('generate po utils', function () {
    var GeneratePoUtils, utils;

    beforeEach(function () {
        GeneratePoUtils = loadModuleExports('bin/lib/generate_po_utils.js');
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
                component = { folder: 'components' };
                ro = 'components/locale/ro';
                en = 'components/locale/en';

                spyOn(utils, 'searchPoTranslation');
            });

            describe('one-to-one', function () {

                beforeEach(function () {
                    utils.searchPoTranslation.andReturn(void 0);
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
                    utils.searchPoTranslation.andCallFake(function (po, id) {
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
                found = utils.searchPoTranslation(po, 'goodbye');

                expect(found).toBe(po.ro.goodbye);

                found = utils.searchPoTranslation(po, 'welcome');

                expect(found).toBe(po.en.welcome);
            });

            it('should return undefined for missing message ids', function () {
                found = utils.searchPoTranslation(po, 'hello, world');

                expect(found).toBeUndefined();
            });

        });

    });

});
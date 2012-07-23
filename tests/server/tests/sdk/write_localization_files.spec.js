describe("Localization files", function() {
    var GeneratePoUtils, fs, wrench, mocks = {},
        locale = {
            "": {
                header1: 'header 1',
                header2: 'header 2'
            },
            "Some translation": [null, "Some translation"],
            "Some other message": ['Plural id', "Some other message", "Plural message"]
        };

    beforeEach(function () {
        mocks['fs'] = fs = jasmine.createSpyObj('fs', ['writeFileSync']);
        mocks['wrench'] = wrench = jasmine.createSpyObj('wrench', ['mkdirSyncRecursive']);

        GeneratePoUtils = loadModuleExports('/bin/lib/generate_po_utils.js', mocks);
    });

    it("should corectly generate the translation", function() {
        var translation = new GeneratePoUtils();

        expect(translation.composePoContent(locale)).toEqual(
            'msgid ""\n' +
            'msgstr ""\n' +
            '"header1: header 1"\n' +
            '"header2: header 2"\n\n' +

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
            '"header1: header 1"\n' +
            '"header2: header 2"\n\n' +

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
                    'Content-Type': 'text/plain; charset=UTF-8\\n',
                    'Plural-Forms': 'nplurals=2; plural=(n != 1);\\n'
                },
                'Some message': [ null, 'Some message' ]
            }
        };

        spyOn(translation, 'composePoContent').andReturn(generatedText);

        translation.createPoFiles(component, poTranslations);

        expect(fs.writeFileSync).toHaveBeenCalledWith('/some/path', generatedText, 'utf8');
    });

    it('shouldn\'t do anything if the file doesn\'t have any messages', function () {
        var translation = new GeneratePoUtils();
        var generatedText =
            'msgid ""\n' +
            'msgstr ""\n' +
            '"header1: header 1"\n' +
            '"header2: header 2"\n\n' +

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
                    'Content-Type': 'text/plain; charset=UTF-8\\n',
                    'Plural-Forms': 'nplurals=2; plural=(n != 1);\\n'
                }
            }
        };

        spyOn(translation, 'composePoContent').andReturn(generatedText);
        translation.createPoFiles(component, poTranslations);

        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
});

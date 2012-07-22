describe("Localization files", function() {
    var GeneratePoUtils,
        locale = {
            "": {
                header1: 'header 1',
                header2: 'header 2'
            },
            "Some translation": [null, "Some translation"],
            "Some other message": ['Plural id', "Some other message", "Plural message"]
        };

    beforeEach(function () {
        GeneratePoUtils = loadModuleExports('/bin/lib/generate_po_utils.js');
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
});

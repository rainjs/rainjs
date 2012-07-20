describe('generate po utils', function () {

    var GeneratePoUtils, utils;

    beforeEach(function () {
        GeneratePoUtils = loadModuleExports('bin/lib/generate_po_utils.js');

        utils = new GeneratePoUtils();
    });

    describe('merge translations', function () {
        describe('compareTranslations', function () {
            var component, po, parsed;

            beforeEach(function () {
                spyOn(utils, 'updateExistingTranslations');
                spyOn(utils, 'addNewTranslations');
            });

            it('should merge translations', function () {
                component = {};
                po = {};
                parsed = {};

                utils.compareTranslations(component, po, parsed);

                expect(utils.updateExistingTranslations).toHaveBeenCalledWith(po, parsed);
                expect(utils.addNewTranslations).toHaveBeenCalledWith(component, po, parsed);
            });
        });
    });
});
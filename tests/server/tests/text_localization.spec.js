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

    it('must corectly resolve arguments', function () {
        expect(translation.translate(component, 'Dear %1$s %2$s,', undefined, undefined, ['Jhon', 'Doe'])).toEqual('Bună ziua domnule Doe,');
    });
});

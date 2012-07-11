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

describe('Registry Plugin: Load translation files', function () {
    var plugin, mocks, Translation, util, fs, component, translation;
    var localeFolder = '/project/components/example/locale';

    beforeEach(function () {
        mocks = {};
        fs = mocks['fs'] = jasmine.createSpyObj('fs', ['readdirSync', 'statSync']);
        Translation = mocks['../translation'] = jasmine.createSpyObj('tranlation', ['get']);
        util = mocks['../util'] = jasmine.createSpyObj('util', ['walkSync']);

        plugin = loadModuleExports('/lib/registry/load_translation_files.js', mocks);

        component = jasmine.createSpyObj('component', ['paths']);
        component.paths.andReturn(localeFolder);

        var stat = jasmine.createSpyObj('stat', ['isDirectory']);
        stat.isDirectory.andReturn(true);
        fs.statSync.andReturn(stat);

        translation = jasmine.createSpyObj('translation', ['loadLanguageFile']);
        Translation.get.andReturn(translation);

        util.walkSync.andCallFake(function (folder, extensions, callback) {
            callback(path.join(folder, 'messages.po'));
        });
    });

    it('should load all po files', function () {
        fs.readdirSync.andReturn(['en_US', 'de_DE']);

        plugin.configure(component);

        expect(component.paths).toHaveBeenCalledWith('locale', true);
        expect(fs.readdirSync).toHaveBeenCalledWith(localeFolder);
        expect(translation.loadLanguageFile).toHaveBeenCalledWith(
            path.join(localeFolder, 'en_US', 'messages.po'), 'en_US', component
        );
        expect(translation.loadLanguageFile).toHaveBeenCalledWith(
            path.join(localeFolder, 'de_DE', 'messages.po'), 'de_DE', component
        );
    });

    it('should not load any po file if the locale folder could not be read', function () {
       fs.readdirSync.andThrow(new Error('directory does not exist'));

       plugin.configure(component);

       expect(translation.loadLanguageFile).not.toHaveBeenCalled();
    });

    it('should not load any po file if the locale folder is empty', function () {
        fs.readdirSync.andReturn([]);

        plugin.configure(component);

        expect(translation.loadLanguageFile).not.toHaveBeenCalled();
     });
});
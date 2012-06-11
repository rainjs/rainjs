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

var cwd = process.cwd();
var globals = require(cwd + '/lib/globals.js');
var Handlebars = require('handlebars');

var configuration = {};

describe('Registry Plugin: Precompile Templates Plugin', function () {
    var mockComponentRegistry, componentRegistry, registryPlugin;

    beforeEach(function () {
        mockComponentRegistry = loadModuleContext('/lib/component_registry.js');
        mockComponentRegistry.scanComponentFolder();
        componentRegistry = new mockComponentRegistry.ComponentRegistry();

        registryPlugin = loadModuleExports('/lib/registry/precompile_templates.js', {
            '../handlebars': Handlebars,
            '../configuration': configuration
        });
    });

    it('must compile the templates for all views', function () {
        var config = componentRegistry.getConfig('error', '1.0');
        registryPlugin.configure(config);
        expect(config.views['403'].compiledTemplate).toBeDefined();
        expect(config.views['404'].compiledTemplate).toBeDefined();
    });

    it('must remove a view from the config when template is not found', function () {
        var config = componentRegistry.getConfig('error', '1.0');
        config.views['invalid_view'] = {};
        registryPlugin.configure(config);
        expect(config.views['invalid_view']).toBeUndefined();
    });

    it('must set the default view path when it is missing', function () {
        var config = componentRegistry.getConfig('error', '1.0');
        config.views['400'].view = undefined;
        registryPlugin.configure(config);
        expect(config.views['400'].view).toEqual('400.html');
    });

    it('must compile the template in the current language', function () {
        configuration.language = 'de_DE';
        configuration.defaultLanguage = 'ro_RO';

        var config = componentRegistry.getConfig('example', '0.0.1');
        registryPlugin.configure(config);

        var template = config.views['info'].compiledTemplate;
        expect(template().replace(/\s+/g, '')).toEqual('de_DE');
    });

    it('must compile the template in the default language', function () {
        configuration.language = 'en_UK';
        configuration.defaultLanguage = 'ro_RO';

        var config = componentRegistry.getConfig('example', '0.0.1');
        registryPlugin.configure(config);

        var template = config.views['info'].compiledTemplate;
        expect(template().replace(/\s+/g, '')).toEqual('ro_RO');
    });

    it('must compile the template in English', function () {
        configuration.language = 'en_UK';
        configuration.defaultLanguage = 'fr_FR';

        var config = componentRegistry.getConfig('example', '0.0.1');
        registryPlugin.configure(config);

        var template = config.views['info'].compiledTemplate;
        expect(template().replace(/\s+/g, '')).toEqual('en_US');
    });
});

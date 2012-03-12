"use strict";

var cwd = process.cwd();
var globals = require(cwd + '/lib/globals.js');
var loadFile = require(cwd + '/tests/server/rain_mocker');
var Handlebars = require('handlebars');

describe('Registry Plugin: Precompile Templates Plugin', function () {
    var mockComponentRegistry, componentRegistry, registryPlugin;

    beforeEach(function () {
        mockComponentRegistry = loadFile(process.cwd() + '/lib/component_registry.js', null, true);
        mockComponentRegistry.scanComponentFolder();
        componentRegistry = new mockComponentRegistry.ComponentRegistry();

        registryPlugin = loadFile(cwd + '/lib/registry/precompile_templates.js', {
            '../handlebars': Handlebars
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
});

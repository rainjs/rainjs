"use strict";

var cwd = process.cwd();
var globals = require(cwd + '/lib/globals.js');
var config = require(cwd + '/lib/configuration.js');
var loadFile = require(cwd + '/tests/server/rain_mocker');
var registryPlugin = require(cwd + '/lib/registry/dynamic_conditions');

describe('Registry Plugin: ' + registryPlugin.name, function () {
    var mockComponentRegistry, componentRegistry;

    beforeEach(function () {
        mockComponentRegistry = loadFile(process.cwd() + '/lib/component_registry.js', null, true);
        mockComponentRegistry.scanComponentFolder();
        componentRegistry = new mockComponentRegistry.ComponentRegistry();
    });

    it('must inject dynamic condition functions', function () {
        var config = componentRegistry.getConfig('example', '0.0.1');
        registryPlugin.configure(config);
        expect(config.dynamicConditions).toBeDefined();
    });

    it('must give undefined back cause there are no dynamic conditions', function () {
        var config = componentRegistry.getConfig('placeholder', '1.0');
        registryPlugin.configure(config);
        expect(config.dynamicConditions).toBeUndefined();
    });
});

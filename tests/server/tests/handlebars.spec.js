"use strict";

var cwd = process.cwd();
var path = require('path');
var globals = require(cwd + '/lib/globals');
var loadFile = require(cwd + '/tests/server/rain_mocker');
var pluginFolder = path.join(cwd, '/lib/handlebars/');

describe('Handlebars configuration', function () {
    var plugins;

    beforeEach(function () {
        spyOn(console, 'log').andCallFake(function () {});

        plugins = {};
        var mocks = {
            'handlebars': {
                registerHelper: function (name, helper) {
                    plugins[name] = helper;
                }
            }
        };

        // Mock the loading of the Handlebars helpers. The helpers are mocked because
        // they have some dependencies that are not so easy to mock.
        mocks[path.join(pluginFolder, 'css.js')] = {
            name: 'css',
            helper: function () {}
        };
        mocks[path.join(pluginFolder, 'component.js')] = {
            name: 'component',
            helper: function () {}
        };
        mocks[path.join(pluginFolder, 'translation.js')] = {
            name: 't',
            helper: function () {}
        };
        mocks[path.join(pluginFolder, 'translation_plural.js')] = {
            name: 'nt',
            helper: function () {}
        };

        loadFile(cwd + '/lib/handlebars.js', mocks, true);
    });

    it('must register all Handlebars plugins', function () {
        expect(typeof plugins['css'] === 'function').toBe(true);
        expect(typeof plugins['component'] === 'function').toBe(true);
        expect(typeof plugins['t'] === 'function').toBe(true);
        expect(typeof plugins['nt'] === 'function').toBe(true);
    });

});

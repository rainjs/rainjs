"use strict";

var cwd = process.cwd();
var globals = require(cwd + '/lib/globals');
var loadFile = require(cwd + '/tests/server/rain_mocker');
var pluginFolder = cwd + '/lib/handlebars/';

describe('Handlebars configuration', function () {
    var mockHandlebars, plugins;

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
        mocks[pluginFolder + 'css.js'] = {
            name: 'css',
            helper: function () {}
        };
        mocks[pluginFolder + 'component.js'] = {
            name: 'component',
            helper: function () {}
        };
        mockHandlebars = loadFile(cwd + '/lib/handlebars.js', mocks, true);
    });

    it('must register all Handlebars plugins', function () {
        expect(typeof plugins['css'] === 'function').toBe(true);
        expect(typeof plugins['component'] === 'function').toBe(true);
    });

});

"use strict";

var cwd = process.cwd();
var globals = require(cwd + '/lib/globals.js');
var config = require(cwd + '/lib/configuration.js');
var loadFile = require(cwd + '/tests/server/rain_mocker');

describe('Data layer', function() {
    var mockComponentRegistry, componentRegistry,
        mockDataLayer, dataLayer;

    var error, data;

    beforeEach(function () {
        mockComponentRegistry = loadFile(cwd + '/lib/component_registry.js', null, true);
        mockComponentRegistry.scanComponentFolder();
        componentRegistry = new mockComponentRegistry.ComponentRegistry();

        var mocks = {
            './component_registry': componentRegistry
        };

        mockDataLayer = loadFile(cwd + '/lib/data_layer.js', mocks, true);

        dataLayer = new mockDataLayer.DataLayer();
    });

    function saveParameters(callbackError, callbackData) {
        error = callbackError;
        data = callbackData;
    }

    it('must throw an error when required arguments are missing or invalid', function () {
        var componentOpt = undefined;
        var finished = false;
        var correctFolder = componentRegistry.getConfig('button', '1.0').folder;

        runs(function () {
            dataLayer.loadData(componentOpt, saveParameters);
            expect(error.message).toBe('Missing componentOptions in function loadData().');

            componentOpt = {};
            dataLayer.loadData(componentOpt, saveParameters);
            expect(error.message).toBe('Missing component id in function loadData().');

            componentOpt.id = 'button';
            dataLayer.loadData(componentOpt, saveParameters);
            expect(error.message).toBe('Missing view id in function loadData().');

            componentOpt.viewId = 'index';
            dataLayer.loadData(componentOpt, saveParameters);
            expect(error.message).toBe('Missing version in function loadData().');

            componentOpt.version = '1.0';
            expect(function () {
                dataLayer.loadData(componentOpt);
            }).toThrow('Missing callback in function loadData().');

            componentOpt.id = 'inexistent';
            dataLayer.loadData(componentOpt, saveParameters);
            expect(error.message).toBe('Component inexistent-1.0 doesn\'t exist.');

            componentOpt.id = 'button';
            componentOpt.viewId = 'no_view';
            dataLayer.loadData(componentOpt, saveParameters);
            expect(error.message).toBe('View no_view doesn\'t exists in meta.json.');

            componentOpt.viewId = 'index';
            componentOpt.data = 'my_data';
            componentRegistry.getConfig('button', '1.0').folder = 'path';
            dataLayer.loadData(componentOpt, function () {
                saveParameters(arguments[0], arguments[1]);
                finished = true;
            });
        });

        waitsFor(function () {
            return finished;
        }, 'Callback was\'t called.');

        runs(function () {
            expect(error).toBeNull();
            expect(data).toBe('my_data');
        });
    });

    it('must call the server-side data function for the view', function () {
        var componentOpt = {
            id: 'button',
            version: '1.0',
            viewId: 'nasty_level3',
            data: 'my_data'
        };
        var finished = false;

        runs(function () {
            dataLayer.loadData(componentOpt, function () {
                saveParameters(arguments[0], arguments[1]);
                finished = true;
            });
        });

        waitsFor(function () {
            return finished;
        }, 'Callback was\'t called.');

        runs(function () {
            expect(error).toBeNull();
            expect(data.old_data).toBe('my_data');
            expect(data.new_data).toBe('my_new_data');
        });
    });
});

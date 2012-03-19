"use strict";

var cwd = process.cwd();
var globals = require(cwd + '/lib/globals');
var loadFile = require(cwd + '/tests/server/rain_mocker');
var configuration = require(cwd + '/lib/configuration');

describe('Error handler', function () {
    var mockComponentRegistry, componentRegistry,
        mockErrorHandler, errorHandler,
        mockConfiguration;

    beforeEach(function () {
        mockComponentRegistry = loadFile(process.cwd() + '/lib/component_registry.js', null, true);
        mockComponentRegistry.scanComponentFolder();
        componentRegistry = new mockComponentRegistry.ComponentRegistry();

        mockConfiguration = {
            errorComponent: configuration.errorComponent
        };
        mockErrorHandler = loadFile(cwd + '/lib/error_handler.js', {
            './component_registry': componentRegistry,
            './configuration': mockConfiguration
        }, true);
    });

    it('must throw an error when the error component is not found', function () {
        mockConfiguration.errorComponent = {};
        expect(function() {
            errorHandler = new mockErrorHandler.ErrorHandler();
        }).toThrow('No error component specified or default doesn\'t exist!');
    });

    it('must throw an error when the default view is not specified', function () {
        mockConfiguration.errorComponent = {
            id: 'example',
            version: '0.0.1'
        };
        expect(function() {
            errorHandler = new mockErrorHandler.ErrorHandler();
        }).toThrow('The error component doesn\'t have a default view!');
    });

    it('must return the default view when the status code is unknown', function () {
        errorHandler = new mockErrorHandler.ErrorHandler();
        var result = errorHandler.getErrorComponent('123');
        expect(result.component).toEqual(componentRegistry.getConfig('error', '1.0'));
        expect(result.view).toEqual('default');
    });

    it('must return the correct status code when it is known', function () {
        errorHandler = new mockErrorHandler.ErrorHandler();
        var result = errorHandler.getErrorComponent('400');
        expect(result.view).toEqual('400');
    });

});

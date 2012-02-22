
"use strict";

var rootPath = process.cwd();
var mod_errorHandler = require(rootPath + '/lib/error_handler');

var errorHandler;

var mockComponents = require('./components_mock.js');

describe('Error handler', function () {
    var componentContainer;
    var components = mockComponents.components;

    beforeEach(function () {
        global.Server = {
            conf: {
                server: {
                    port: 1337,
                    serverRoot: '',
                    componentPath : ''
                },
                errorComponent: {
                    name: 'error',
                    version: '1.0'
                }
            },
            UUID : "SERVER-UUID",
            root : ''
        };

        var mod_componentContainer = require(rootPath + '/lib/componentcontainer.js').ComponentContainer;

        componentContainer = {
            componentMap: {},
            versions: {},
            registerComponent: mod_componentContainer.prototype.registerComponent,
            getLatestVersion: mod_componentContainer.prototype.getLatestVersion,
            createComponent: mod_componentContainer.prototype.createComponent,
            getConfiguration: mod_componentContainer.prototype.getConfiguration,
            getViewByViewId: mod_componentContainer.prototype.getViewByViewId,
            scanComponentFolder: function () {
                for (var i = 0, l = components.length; i < l; i++) {
                    this.registerComponent(components[i]);
                }
            }
        };

        componentContainer.scanComponentFolder();

        this.errorHandler = new mod_errorHandler(componentContainer);
    });


    describe('error valid code', function () {
        it('500 error code', function () {
            var config = this.errorHandler.renderError(500);

            expect(config).toBeDefined();
            expect(config.module).toEqual('error;1.0');
            expect(config.view).toEqual('/htdocs/500.html');
        });
    });

    describe('error invalid code', function () {
        it('900 error code', function () {
            var config = this.errorHandler.renderError(900);
            expect(config).toBeUndefined();
        });
    });

    afterEach(function () {
        delete this.errorHandler;
    });
});

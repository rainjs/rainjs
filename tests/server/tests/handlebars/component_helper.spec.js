var rootPath = process.cwd(),
    componentHelper,
    mod_tagmanager = require(rootPath + '/lib/tagmanager'),
    Handlebars = require('handlebars'),
    mock = require('../components_mock.js');

describe('Handlebars component helper', function () {
    var componentContainer, handlebarsData;

    var components = mock.components;
    var versions = mock.versions;

    beforeEach(function () {
        componentHelper = require(rootPath + '/lib/handlebars/component');
        Handlebars.registerHelper(componentHelper.name, componentHelper.helper);

        var ComponentContainer = require(rootPath + '/lib/componentcontainer.js').ComponentContainer;

        componentContainer = {
            componentMap: {},
            versions: {},
            registerComponent: ComponentContainer.prototype.registerComponent,
            getLatestVersion: ComponentContainer.prototype.getLatestVersion,
            createComponent: ComponentContainer.prototype.createComponent,
            getConfiguration: ComponentContainer.prototype.getConfiguration,
            getViewByViewId: ComponentContainer.prototype.getViewByViewId,
            scanComponentFolder: function () {
                for (var i = 0, l = components.length; i < l; i++) {
                    this.registerComponent(components[i]);
                }
            }
        };

        componentContainer.scanComponentFolder();
        var component = componentContainer.createComponent("button;1.0");
        component.tagmanager = new mod_tagmanager.TagManager([]);

        // rain context
        handlebarsData = {
            rain: function () {
                return {
                    component: component
                }
            }
        };
    });

    describe('register plugin to handlebars', function () {
        it('must register the component helper to Handlbars', function () {
            expect(componentHelper.name).toEqual('component');
            expect(typeof componentHelper.helper).toEqual('function');
        });
    });

    describe('test required and optional options', function() {
        it('must parse the component and give the cutsom tag back', function() {
            // With default options.
            var template = Handlebars.compile('{{component}}');
            expect(template(handlebarsData)).toEqual('<button_10_index />');

            // With another view id.
            var template = Handlebars.compile('{{component view="main"}}');
            expect(template(handlebarsData)).toEqual('<button_10_main />');

            // With a different version, current component version must refused.
            var template = Handlebars.compile('{{component version="2.4"}}');
            expect(template(handlebarsData)).toEqual('<button_10_index />');

            // Test latest version.
            var template = Handlebars.compile('{{component name="button"}}');
            expect(template(handlebarsData)).toEqual('<button_521_index />');

            // Test static id option.
            var template = Handlebars.compile('{{component name="button" sid="buttonTest"}}');
            expect(template(handlebarsData)).toEqual('<button_521_index data-sid="buttonTest" />');

            // With all options.
            var template = Handlebars.compile('{{component name="button" view="main" version="2.4" sid="test"}}');
            expect(template(handlebarsData)).toEqual('<button_24_main data-sid="test" />');
        });
    })

    describe('test common error scenarios', function () {
        it('should return a 404 error if the component is not found', function () {
            var template = Handlebars.compile('{{component name="inexistent"}}');
            expect(template(handlebarsData)).toEqual('<exception_404 />');
        });

        it('should return a 404 error if the view is not found', function () {
            var template = Handlebars.compile('{{component name="button" view="inexistent"}}');
            expect(template(handlebarsData)).toEqual('<exception_404 />');
        });

        it('should return undefined if the exception component cannot be found', function () {
            Server.conf.errorPagesComponent = {module: 'inexistent', version: '1.0'};
            var template = Handlebars.compile('{{component name="inexistent"}}');
            expect(template(handlebarsData)).toEqual('');
        });
    });
});

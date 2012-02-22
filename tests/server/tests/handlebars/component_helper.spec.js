var rootPath = process.cwd();
var componentHelper;
var mod_tagmanager = require(rootPath + '/lib/tagmanager');
var Handlebars = require('handlebars');
var mock = require('../components_mock');

describe('Handlebars component helper', function () {
    var componentContainer, handlebarsData, handlebarsData1;

    var components = mock.components;
    var versions = mock.versions;

    beforeEach(function () {
        componentHelper = require(rootPath + '/lib/handlebars/component');
        Handlebars.registerHelper(componentHelper.name, componentHelper.helper);

        var ComponentContainer = require(rootPath + '/lib/componentcontainer').ComponentContainer;

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
                    component: component,
                    session : {
                        user: {
                            accountId: '1o1GUID-ABCDE',
                            permissions: [
                                'contracts', 'view_contract', 'choose_contract'
                            ],
                            country: 'RO',
                            language: 'ro_RO'
                        }
                    }
                }
            }
        };

        handlebarsData1 = {
                rain: function () {
                    return {
                        component: component,
                        session : {
                            user: {
                                accountId: '1o1GUID-ABCDE',
                                permissions: [
                                    'edit_contract'
                                ],
                                country: 'US',
                                language: 'en_US'
                            }
                        }
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
            expect(template(handlebarsData)).toEqual('<button_1_0_index />');

            // With another view id.
            var template = Handlebars.compile('{{component view="main"}}');
            expect(template(handlebarsData)).toEqual('<button_1_0_main />');

            // With a different version, current component version must refused.
            var template = Handlebars.compile('{{component version="2.4"}}');
            expect(template(handlebarsData)).toEqual('<button_1_0_index />');

            // Test latest version.
            var template = Handlebars.compile('{{component name="button"}}');
            expect(template(handlebarsData)).toEqual('<button_5_2_1_index />');

            // Test static id option.
            var template = Handlebars.compile('{{component name="button" sid="buttonTest"}}');
            expect(template(handlebarsData)).toEqual('<button_5_2_1_index data-sid="buttonTest" />');

            // With all options.
            var template = Handlebars.compile('{{component name="button" view="main" version="2.4" sid="test"}}');
            expect(template(handlebarsData)).toEqual('<button_2_4_main data-sid="test" />');
        });
    });

    describe('successful authorizathion', function () {
        it('should pass component level checks for permissions', function () {
            var template = Handlebars.compile('{{component name="textbox" version="3.6.1" view="index"}}');
            expect(template(handlebarsData1)).toEqual('<textbox_3_6_1_index />');
        });

        it('should pass component level checks for dynamic conditions', function () {
            var template = Handlebars.compile('{{component name="textbox" version="1.0.3" view="index"}}');
            expect(template(handlebarsData1)).toEqual('<textbox_1_0_3_index />');
        });

        it('should pass view level checks for permissions', function () {
            var template = Handlebars.compile('{{component name="dropdown" version="1.3" view="index"}}');
            expect(template(handlebarsData1)).toEqual('<dropdown_1_3_index />');
        });

        it('should pass view level checks for dynamic conditions', function () {
            var template = Handlebars.compile('{{component name="dropdown" version="1.3" view="main"}}');
            expect(template(handlebarsData1)).toEqual('<dropdown_1_3_main />');
        });
    });

    describe('test common error scenarios', function () {
        it('should return a 404 error if the component is not found', function () {
            var template = Handlebars.compile('{{component name="inexistent"}}');
            expect(template(handlebarsData)).toEqual('<exception_404 />');
        });

        it('should return a 404 error if the view is not found', function () {
            var template = Handlebars.compile('{{component name="button" view="inexistent"}}');
            expect(template(handlebarsData)).toEqual('<exception_404 />');
        });

        it('should return a 401 error if the component is not authorized (permissions)', function () {
            var template = Handlebars.compile('{{component name="textbox" version="3.6.1" view="index"}}');
            expect(template(handlebarsData)).toEqual('<exception_401 />');
        });

        it('should return a 401 error if the component is not authorized (dynamic conditions)', function () {
            var template = Handlebars.compile('{{component name="textbox" version="1.0.3" view="index"}}');
            expect(template(handlebarsData)).toEqual('<exception_401 />');
        });

        it('should return a 401 error if the view is not authorized (permissions)', function () {
            var template = Handlebars.compile('{{component name="dropdown" version="1.3" view="index"}}');
            expect(template(handlebarsData)).toEqual('<exception_401 />');
        });

        it('should return a 401 error if the view is not authorized (dynamic conditions)', function () {
            var template = Handlebars.compile('{{component name="dropdown" version="1.3" view="main"}}');
            expect(template(handlebarsData)).toEqual('<exception_401 />');
        });

        it('should return undefined if the exception component cannot be found', function () {
            Server.conf.errorPagesComponent = {module: 'inexistent', version: '1.0'};
            var template = Handlebars.compile('{{component name="inexistent"}}');
            expect(template(handlebarsData)).toEqual('');
        });
    });
});

"use strict";

var cwd = process.cwd();
var globals = require(cwd + '/lib/globals.js');
var config = require(cwd + '/lib/configuration');
var loadFile = require(cwd + '/tests/server/rain_mocker');

describe('Handlebars component helper', function () {
    var componentHelper, Handlebars,
        mockComponentRegistry, componentRegistry,
        mockRenderer,
        mockRenderUtils,
        renderer,
        rainContext,
        childComponent;

    beforeEach(function () {
        var errorHandler = {
            getErrorComponent: function(statusCode){
                return {
                    component: {
                        id: "error",
                        version: "1.0"
                    },
                    view: statusCode
                };
            }
        };
        mockComponentRegistry = loadFile(cwd + '/lib/component_registry.js', null, true);
        var plugins = ['dynamic_conditions'];
        mockComponentRegistry.scanComponentFolder();
        mockComponentRegistry.registerPlugins(plugins);
        mockComponentRegistry.configurePlugins(plugins);
        componentRegistry = new mockComponentRegistry.ComponentRegistry();
        mockRenderUtils = loadFile(cwd + '/lib/render_utils.js', {
            './error_handler': errorHandler,
            './component_registry': componentRegistry
        });
        mockRenderer = loadFile(cwd + '/lib/renderer.js', {
            './error_handler': errorHandler,
            './socket_registry': {
                register: function () {}
            },
            './data_layer': null,
            './component_registry': componentRegistry,
            './render_utils': mockRenderUtils
        }, true);

        renderer = new mockRenderer.Renderer();

        rainContext = {
            css: [],
            component: {
                id: 'example',
                version: '0.0.1'
            },
            childrenInstanceIds: [],
            instanceId: '12345',
            transport: {
                renderCount: 0,
                renderLevel: 0
            }
        };

        renderer.rain = rainContext;
        renderer.createInstanceId = function () {
            return 'new instance id';
        };

        childComponent = null;
        renderer.loadDataAndSend = function (component) {
            childComponent = component;
        };

        componentHelper = loadFile(cwd + '/lib/handlebars/component.js', {
            '../component_registry': componentRegistry,
            '../renderer': renderer,
            '../render_utils': mockRenderUtils
        });

        Handlebars = require('handlebars');

        Handlebars.registerHelper(componentHelper.name, componentHelper.helper);
    });

    describe('register plugin to handlebars', function () {

        it('must register the component helper to Handlebars', function () {
            expect(componentHelper.name).toEqual('component');
            expect(typeof componentHelper.helper).toEqual('function');
        });

    });

    /**
     * Expect that the child component is actually the error component.
     *
     * @param {Object} childComponent the component
     * @param {Number} statusCode the error status code
     */
    function expectError(childComponent, statusCode) {
        expect(childComponent.id).toEqual('error');
        expect(childComponent.version).toEqual('1.0');
        expect(childComponent.view).toEqual(statusCode);
    }

    /**
     * Expect the child component to match the specified component.
     *
     * @param {Object} childComponent the component
     * @param {Object} component the component object
     */
    function expectComponent(childComponent, component) {
        expect(childComponent.id).toEqual(component.id);
        expect(childComponent.version).toEqual(component.version);
        expect(childComponent.view).toEqual(component.view);
    }

    describe('test required and optional options', function () {

        it('must require "view" to be defined', function () {
            Handlebars.compile('{{component name="button"}}')();
            expect(rainContext.childrenInstanceIds.length).toEqual(1);
            expectError(childComponent, 500);
        });

        it('must require "name" to be defined when "version" is present', function () {
            Handlebars.compile('{{component version="1.1" view="index"}}')();
            expectError(childComponent, 500);
        });

        it('must add all the necessary JSON dependencies', function () {
            Handlebars.compile('{{component name="button" version="1.0" view="index"}}')();
            expect(childComponent.instanceId).toBeDefined();
            expect(rainContext.transport.renderCount).toEqual(1);
            expect(rainContext.transport.renderLevel).toEqual(1);
            expectComponent(childComponent, {
                id: 'button',
                version: '1.0',
                view: 'index'
            });
        });

    });

    describe('test default options and error cases', function () {

        it('must use the current component when "name" is not defined', function () {
            rainContext.component.version = "1.3.0";
            Handlebars.compile('{{component view="index"}}')();
            expectComponent(childComponent, {
                id: 'example',
                version: '1.3.0',
                view: 'index'
            });
        });

        it('must use the "error" component when the component is not found', function () {
            Handlebars.compile('{{component name="invalid_name" view="index"}}')();
            expectError(childComponent, 404);
        });

        it('must use the "error" component when the view is not found', function () {
            Handlebars.compile('{{component name="button" view="invalid_index"}}')();
            expectError(childComponent, 404);
        });

    });

    /**
     * Sets information about the user in the session.
     *
     * @param {Object} [user] use this user information instead of some default one
     */
    function setUserInSession(user) {
        rainContext.session = {
            user: user || {
                permissions: [
                    'view_button', 'view_restricted'
                ],
                country: 'US',
                language: 'en_US'
            }
        };
    }

    describe('test authorization cases', function () {

        it('must use the required component when the permission cases pass', function () {
            setUserInSession();
            Handlebars.compile('{{component name="button" version="1.0" view="restricted"}}')();
            expectComponent(childComponent, {
                id: 'button',
                version: '1.0',
                view: 'restricted'
            });
        });

        it('must use the "error" component when permission cases fail', function () {
            Handlebars.compile('{{component name="button" version="1.0" view="restricted"}}')();
            expectError(childComponent, 401);
        });

        it('must pass component level checks for dynamic conditions', function () {
            setUserInSession();
            Handlebars.compile('{{component name="button" version="2.0" view="buttons"}}')();
            expectComponent(childComponent, {
                id: 'button',
                version: '2.0',
                view: 'buttons'
            });
        });

        it('must use the "error" component when component level dynamic conditions fail', function () {
            setUserInSession({
                country: 'RO'
            });
            Handlebars.compile('{{component name="button" version="2.0" view="buttons"}}')();
            expectError(childComponent, 401);
        });

        it('must pass view level checks for dynamic conditions', function () {
            setUserInSession();
            Handlebars.compile('{{component name="button" version="2.0" view="index"}}')();
            expectComponent(childComponent, {
                id: 'button',
                version: '2.0',
                view: 'index'
            });
        });

        it('must use the "error" component when view level dynamic conditions fail', function () {
            setUserInSession({
                country: 'US',
                language: 'ro_RO'
            });
            Handlebars.compile('{{component name="button" version="2.0" view="index"}}')();
            expectError(childComponent, 401);
        });

    });

    describe('test that the components are added to the children for the parent', function () {

        it('must contain the correct child information', function () {
            Handlebars.compile('{{component name="button" version="1.0" view="index"}}')();
            var childComponentForParent = rainContext.childrenInstanceIds[0];
            expect(childComponentForParent.id).toEqual("button");
            expect(childComponentForParent.version).toEqual("1.0");
            expect(childComponentForParent.controller).toEqual("index.js");
        });
    });

    describe('test that the context is extended with custom attributes', function () {

        it('must extend the aggregated component with custom attributes', function () {
            Handlebars.compile('{{component name="button" version="1.0" view="index" ' +
                                   'customValueNumber=4 ' +
                                   'customValueString="string" ' +
                                   'customValueBoolean=true ' +
                               '}}')();
            expect(childComponent.context.customValueNumber).toEqual(4);
            expect(childComponent.context.customValueString).toEqual("string");
            expect(childComponent.context.customValueBoolean).toEqual(true);
        });
    });

    describe('test component helper used as a block helper', function () {

        it('must add the context function as a key', function () {
            Handlebars.compile('{{#component name="button" version="1.0" view="index"}}' +
                               '{{state}}' +
                               '{{/component}}')();

            var state = 'test';
            expect(typeof childComponent.fn === 'function').toBe(true);
            expect(childComponent.fn({state: state})).toBe(state);
        });
    });
});

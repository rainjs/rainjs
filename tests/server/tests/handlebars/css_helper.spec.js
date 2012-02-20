
"use strict";

var rootPath = process.cwd();
var cssHelper = require(rootPath + '/lib/handlebars/css');
var Handlebars = require('handlebars');
var mock = require('../components_mock.js');

Handlebars.registerHelper(cssHelper.name, cssHelper.helper);

describe('handlebars css helper', function () {
    var componentContainer, handlebarsData;

    var components = mock.components;
    var versions = mock.versions;

    beforeEach(function () {
        var ComponentContainer = require(rootPath + '/lib/componentcontainer.js').ComponentContainer;

        componentContainer = {
            componentMap: {},
            versions: {},
            registerComponent: ComponentContainer.prototype.registerComponent,
            getLatestVersion: ComponentContainer.prototype.getLatestVersion,
            createComponent: ComponentContainer.prototype.createComponent,
            getConfiguration : ComponentContainer.prototype.getConfiguration,
            scanComponentFolder: function () {
                for (var i = 0, l = components.length; i < l; i++) {
                    this.registerComponent(components[i]);
                }
            }
        };

        componentContainer.scanComponentFolder();

        // Rain context.
        handlebarsData = {
            rain: function () {
                return {
                    component : componentContainer.createComponent("button;1.0")
                }
            }
        };
    });

    describe('register plugin to handlebars', function () {
        it('must register the css helper to handlebars', function () {
            expect(cssHelper.name).toEqual('css');
            expect(typeof cssHelper.helper).toEqual('function');
        });
    });

    describe('test required and optional options', function () {
        it('must parse the given template with an error', function() {
            var template = Handlebars.compile('{{css withoutrequiredPath=""}}');
            expect(function() {
                template({});
            }).toThrow('precondition failed: rain function is missing.');
        });

        it('option "path" must be required', function () {
            // Test internal css resource.
            var template = Handlebars.compile('{{css version="1.0"}}');
            expect(function() {
                template(handlebarsData)
            }).toThrow('precondition failed: css path is missing.');
        });

        it('must correctly create css links for the same component', function () {
            // Test internal css resource.
            var template = Handlebars.compile('{{css path="index.css"}}');
            expect(template(handlebarsData)).toEqual('<link rel="stylesheet" href="htdocs/css/index.css" type="text/css"/>');

            /*
             * Test with version. Version will be overwritten with the used component
             * so that the result is an internal link.
             */
            var template = Handlebars.compile('{{css path="index.css" version="2.4"}}');
            expect(template(handlebarsData)).toEqual('<link rel="stylesheet" href="htdocs/css/index.css" type="text/css"/>');

            // Same version and component like the used component is automatically an internal link.
            var template = Handlebars.compile('{{css component="button" path="index.css" version="1.0"}}');
            expect(template(handlebarsData)).toEqual('<link rel="stylesheet" href="htdocs/css/index.css" type="text/css"/>');
        })

        it('must correctly create css links for external components', function() {
            // Test external resource with latest version.
            var template = Handlebars.compile('{{css component="textbox" path="index.css"}}');
            expect(template(handlebarsData)).toEqual('<link rel="stylesheet" href="webcomponent://textbox;3.6.1/htdocs/css/index.css" type="text/css"/>');

            // Test external resource with given version.
            var template = Handlebars.compile('{{css component="textbox" version="1.0.3" path="index.css"}}');
            expect(template(handlebarsData)).toEqual('<link rel="stylesheet" href="webcomponent://textbox;1.0.3/htdocs/css/index.css" type="text/css"/>');
        });
    })
});

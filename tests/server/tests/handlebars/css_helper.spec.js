"use strict";
var cwd = process.cwd();
var globals = require(cwd + '/lib/globals.js');
var config = require(cwd + '/lib/configuration');
var loadFile = require(cwd + '/tests/server/rain_mocker');

describe('handlebars css helper', function () {
    var cssHelper, Handlebars, mockComponentRegistry, componentRegistry, rainContext;
    
    beforeEach(function () {
        mockComponentRegistry = loadFile(process.cwd() + '/lib/component_registry.js', null, true);
        mockComponentRegistry.scanComponentFolder();
        componentRegistry = new mockComponentRegistry.ComponentRegistry();
        rainContext = {
            css: [],
            component: {
                id: 'example',
                version: '1.0'
            }
        };
        
        cssHelper = loadFile(cwd + '/lib/handlebars/css.js', {
            '../component_registry': componentRegistry,
            '../renderer': {
                rain: rainContext
            }
        });
        Handlebars = require('handlebars');
        
        Handlebars.registerHelper(cssHelper.name, cssHelper.helper);
    });

    describe('register plugin to handlebars', function () {
        console.log(rainContext);
        it('must register the css helper to handlebars', function () {
            expect(cssHelper.name).toEqual('css');
            expect(typeof cssHelper.helper).toEqual('function');
        });
    });

    describe('test required and optional options', function () {
        it('option "path" must be required', function () {
            console.log(rainContext);
            var template = Handlebars.compile('{{css version="1.0"}}');
            expect(function() {
                template();
            }).toThrow('css path is missing.');
        });

        it('must create correct css dependencies for the same component', function () {
            Handlebars.compile('{{css path="index.css"}}')();
            expect(rainContext.css.length).toEqual(1);
            expect(rainContext.css[0]).toEqual('/example/1.0/css/index.css');
        });
        
        it('must ignore version here and create correct css dependency', function () {
            Handlebars.compile('{{css path="index.css" version="2.4"}}')();
            expect(rainContext.css.length).toEqual(1);
            expect(rainContext.css[0]).toEqual('/example/1.0/css/index.css');
        });
        
        it('must create correct dependency css with latest version', function() {
            Handlebars.compile('{{css component="example" path="index.css"}}')();
            expect(rainContext.css[0]).toEqual('/example/4.5.2/css/index.css');
        });
        
        it('must create correct css dependency for external components', function() {
            // Test external resource with latest version.
            Handlebars.compile('{{css component="error" path="index.css"}}')();
            expect(rainContext.css[0]).toEqual('/error/1.0/css/index.css');

            // Test external resource with given version.
            Handlebars.compile('{{css component="example" version="1.3.5" path="index.css"}}')();
            expect(rainContext.css[1]).toEqual('/example/1.3.5/css/index.css');
        });
    });
});
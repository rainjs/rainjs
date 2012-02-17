var rootPath = process.cwd(),
    componentHelper = require(rootPath + '/lib/handlebars/component'),
    mod_tagmanager = require(rootPath + '/lib/tagmanager'),
    Handlebars = require('handlebars'),
    mock = require('../server_mock.js');

Handlebars.registerHelper(componentHelper.name, componentHelper.helper);

describe('Handlebars component helper', function () {
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
            //with default options
            var template = Handlebars.compile('{{component}}');
            expect(template(handlebarsData)).toEqual('<button_10_index />');
            
            //with another viewid
            var template = Handlebars.compile('{{component view="main"}}');
            expect(template(handlebarsData)).toEqual('<button_10_main />');
            
            //with a different version, current component version must refused
            var template = Handlebars.compile('{{component version="2.4"}}');
            expect(template(handlebarsData)).toEqual('<button_10_index />');
            
            //test latest version
            var template = Handlebars.compile('{{component name="button"}}');
            expect(template(handlebarsData)).toEqual('<button_521_index />');
            
            //test static id option
            var template = Handlebars.compile('{{component name="button" sid="buttonTest"}}');
            expect(template(handlebarsData)).toEqual('<button_521_index data-sid="buttonTest" />');
            
            //with all options
            var template = Handlebars.compile('{{component name="button" view="main" version="2.4" sid="test"}}');
            expect(template(handlebarsData)).toEqual('<button_24_main data-sid="test" />');
        });
    })

});


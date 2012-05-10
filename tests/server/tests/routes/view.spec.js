"use strict";

var cwd = process.cwd();
var globals = require(cwd + '/lib/globals.js');
var config = require(cwd + '/lib/configuration.js');
var routerPlugin = loadModuleExports('/lib/routes/view.js', {
    "../renderer": {
        renderBootstrap: function(component, viewId, request, response){
            return "bootstrap with "+component.id+" "+component.version+" "+viewId;
        }
    }
});

var http = require('mocks').http;

describe('Router Plugin: ' + routerPlugin.name, function() {
    var mockComponentRegistry = null;
    var componentRegistry = null;
    var response = null;
    var request = null;
    beforeEach(function() {
        response = new http.ServerResponse();
        request = new http.ServerRequest();
        mockComponentRegistry = loadModuleContext('/lib/component_registry.js');
        mockComponentRegistry.scanComponentFolder();
        componentRegistry = new mockComponentRegistry.ComponentRegistry();
        response.write = function(text){
            if(!this._body){
                this._body = "";
            }
            this._body += text;
        };
    });

    it('must return the bootstrap html', function() {
        request.path = "index";
        request.component = componentRegistry.getConfig("example", "0.0.1");
        routerPlugin.handle(request, response);
        expect(response._body).toEqual("bootstrap with example 0.0.1 index");
        response.finished = true;
    });
});

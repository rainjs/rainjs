"use strict";

var cwd = process.cwd();
var globals = require(cwd + '/lib/globals.js');
var config = require(cwd + '/lib/configuration.js');
var routerPlugin = loadModuleExports('/lib/routes/controller.js', {
    "../router_utils": {
        handleError: function(error, request, response) {
            response._body = "error|"+error.message+"|"+error.code;
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
    });

    it('must call the server side controller and give an anwser back', function() {
        request.method = "get";
        request.path = "level2";
        request.component = componentRegistry.getConfig("example", "0.0.1");
        routerPlugin.handle(request, response);
        expect(response._body).toEqual("finished");
        response.finished = true;
    });

    /**
     * In this use case is no server script defined in the meta.json
     * but the js file exists with the viewID as name
     */
    it('must call the server side controller and give an anwser back (default fallback)', function() {
        request.method = "get";
        request.path = "index";
        request.component = componentRegistry.getConfig("example", "0.0.1");
        routerPlugin.handle(request, response);
        expect(response._body).toEqual("finished");
        response.finished = true;
    });

    it('must call an error cause there is no specified controller', function() {
        request.method = "get";
        request.path = "level3";
        request.component = componentRegistry.getConfig("example", "0.0.1");
        routerPlugin.handle(request, response);
        expect(response._body).toEqual("error|The specified controller was not found!|404");
        response.finished = true;
    });

    it('must call an error cause the controller is not anwsering for the given timeout', function() {
        runs(function(){
            request.method = "post";
            request.path = "index";
            request.component = componentRegistry.getConfig("example", "0.0.1");
            routerPlugin.handle(request, response);
        });

        waitsFor(function(){
            if(response._body != null){
                return true;
            }
        });

        runs(function(){
            expect(response._body).toEqual("error|The controller method timed out|504");
        });
    });
});

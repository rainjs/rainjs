"use strict";

var cwd = process.cwd();
var fs = require('fs');
var controllerPathPlugin = require(cwd + '/lib/registry/controller_path');

describe('Registry Plugin: ' + controllerPathPlugin.name, function () {
    var componentConfig = null;
    beforeEach(function(){
        componentConfig = JSON.parse(fs.readFileSync(cwd +
                              '/tests/server/fixtures/components/example/meta.json'));
    });

    it('must rewrite the js clientside controller to the right url', function () {
        var views = componentConfig.views;
        var clientController = {};
        for (var view in views) {
            if (views[view].controller && views[view].controller.client) {
                clientController[view] = views[view].controller.client;
            }
        }
        controllerPathPlugin.configure(componentConfig);

        for (var view in views) {
            if (views[view].controller && views[view].controller.client) {
                expect(views[view].controller.client).toEqual('/' + componentConfig.id + '/' +
                                                              componentConfig.version + '/js/' +
                                                              clientController[view]);
            }
        }
    });
});

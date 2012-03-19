"use strict";

var cwd = process.cwd();
var fs = require('fs');
var config = require(cwd + '/lib/configuration');
var loadFile = require(cwd + '/tests/server/rain_mocker');
var registryPlugin = loadFile(cwd + '/lib/registry/intents.js', {
    '../intent_registry': {}
});

describe('Registry Plugin: ' + registryPlugin.name, function () {
    var componentConfig = null,
        registeredIntents = null;
    beforeEach(function(){
        registeredIntents = [];
        registryPlugin = loadFile(cwd + '/lib/registry/intents.js', {
            '../intent_registry': {
                register: function(component, intent){
                    registeredIntents.push({
                        component: component.id,
                        intent: intent
                    });
                }
            }
        });
        componentConfig = JSON.parse(fs.readFileSync(cwd +
                                 '/tests/server/fixtures/components/example_1_3/meta.json'));
    });

    it('must register 2 intents', function () {
        registryPlugin.configure(componentConfig);
        expect(registeredIntents.length).toEqual(2);
        expect(registeredIntents[0].intent.action).toEqual("com.rain.test.serverside.INLINE_LOGGING");
        expect(registeredIntents[1].intent.action).toEqual("com.rain.test.general.SHOW_CHAT");
    });
});

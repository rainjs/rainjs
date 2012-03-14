"use strict";

var cwd = process.cwd();
var loadFile = require(cwd + '/tests/server/rain_mocker');
var globals = require(cwd + '/lib/globals.js');
var conf = require(cwd + '/lib/configuration');

var intent = {
    type: 'view',
    category: 'com.intents.rain.test',
    action: 'DO_SOMETHING',
    provider: 'some_view'
};

var component = {
    id: 'button',
    version: '2.0',
    views: {
        'some_view': {}
    }
};

describe('Intent Registry', function () {
    var intentRegistry, intentRegistryContext;

    beforeEach(function () {
        /*intentRegistry = loadFile(process.cwd() + '/lib/intent_registry.js', {
            './configuration': {
                errorComponent: conf.errorComponent
            }
        }, true);*/
    });

    /*it('must register a intent', function () {
        intentRegistry.register(component, intent);

        expect(intentRegistryContext['button_2.0']).toBeTruthy();
    });*/

    afterEach(function () {
        intentRegistryContext = {};
    });
});

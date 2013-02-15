"use strict";

describe('iternationalisation module', function () {
    var request, global, fakeConfig, internationalisationMock, mocks, fakeSession;
    beforeEach(function () {
        fakeConfig = {};
        fakeConfig["languages"] = [
                                   {"key": "en_US", "text": "English"},
                                   {"key": "de_DE", "text": "Deutsch"},
                                   {"key": "ro_RO", "text": "Română"},
                                   {"key": "ar_SA", "text": "عربي"}
                               ];
        fakeConfig["defaultLanguage"] =  "en_US";
        mocks = {};

        request = jasmine.createSpyObj('request', ['rainRoute', 'session', 'sessionStore', 'headers']);
        request.headers = {
                'host': 'atrifan.ro.schlund.net',
                'accept-language': 'en-US,en;q=0.7'
        };

        global = jasmine.createSpyObj('global', ['get', 'set']);
        request.session = {
                global: global
        };

        fakeSession = {};

        request.session.global.get = function(key) {
            return fakeSession[key];
        };
        request.session.global.set = function(key, value) {
            fakeSession[key] = value;
        };
        request.sessionStore = {
                save: function () {}
        };
        request.rainRoute = {
                routeName: 'controller'
        };

        mocks["./configuration"] = fakeConfig;
        internationalisationMock = loadModuleExports(
                '/lib/internationalisation.js', mocks);
    });

    it('should set the user language to the Accepted-Language header if is supported' +
            'in the domain', function () {
        var finished = false,
            next = function () {
                finished = true;
            },
            response = {};

        fakeConfig["tlds"] = {
                "net": {
                    defaultLanguage: 'ro_RO',
                    supportedLanguages: ['ro_RO', 'en_US']
                }
        };

        internationalisationMock()(request, response, next);

        expect(fakeSession["userLanguage"]).not.toEqual(fakeConfig["tlds"]["net"].defaultLanguage);
        expect(finished).toBe(true);
    });

    it('should set the user language to the default language of the domain if it is supported' +
            'and the Accepted-Language is not accepted by the domain', function () {
        var finished = false,
            next = function () {
                finished = true;
            },
            response = {};

        fakeConfig["tlds"] = {
                net: {
                    defaultLanguage: 'ar_AR',
                    supportedLanguages: ['ar_AR', 'ro_RO']
                }
        };

        internationalisationMock()(request, response, next);

        expect(fakeSession["userLanguage"]).toEqual(fakeConfig["tlds"]["net"].defaultLanguage);
        expect(finished).toBe(true);
    });

    it('should set the user language from the config if Accepted-Language is not supported ' + 
            'and domain is not existing', function () {
        var finished = false,
            next = function () {
                finished = true;
            },
            response = {};

        request.headers = {
                'host': 'atrifan.ro.schlund.net',
                'accept-language': 'jp-JP,jp;q=0.7'
        };
        fakeConfig["tlds"] = {
                com: {
                    defaultLanguage: 'ar_AR',
                    supportedLanguages: ['ar_AR', 'ro_RO']
                }
        };

        internationalisationMock()(request, response, next);
        //this is ok because it will be set later on when a component is accessed
        expect(fakeSession["userLanguage"]).toBe(undefined);
        expect(finished).toBe(true);
    });

    it('should set the default language to the Accepted-Language header if is supported and' +
            'the domain is not set', function () {
        var finished = false,
            next = function () {
                finished = true;
            },
            response = {};

        request.headers = {
                'host': 'atrifan.ro.schlund.net',
                'accept-language': 'en-US,de;q=0.7'
        };
        fakeConfig["tlds"] = {
                com: {
                    defaultLanguage: 'ar_AR',
                    supportedLanguages: ['ar_AR', 'ro_RO']
                }
        };

        internationalisationMock()(request, response, next);

        expect(fakeSession["userLanguage"]).toEqual('de_DE');
        expect(finished).toBe(true);
    });

    it('should set in the session the accepted languages regarding the base config', function () {
        var finished = false,
            next = function () {
                finished = true;
            },
            response = {};

        fakeConfig["tlds"] = {
                net: {
                    defaultLanguage: 'ar_AR',
                    supportedLanguages: ['ar_AR', 'ro_RO']
                }
        };

        internationalisationMock()(request, response, next);
        //this is ok because ar_AR is not supported in the default configuration if text
        expect(fakeSession["acceptedLanguages"]).toEqual([{"key": "ro_RO", "text": "Română"}]);
        expect(fakeSession["acceptedLanguages"].length).toEqual(1);
        expect(finished).toBe(true);
    });
});

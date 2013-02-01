// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";

var cwd = process.cwd(),
    path = require('path'),
    globals = require(cwd + '/lib/globals');

var configurationsFolder = cwd + '/tests/server/fixtures/';

describe('Server configuration and validation', function () {

    var defaultconf, credentials, fs, loadConfiguration, defaultLoadingComponent,
        defaultErrorComponent; 
    beforeEach(function () {

        defaultLoadingComponent = {
                "id": "placeholder",
                "version": "1.0",
                "viewId": "index",
                "timeout": 500
        };

        defaultErrorComponent = {
                "id": "error",
                "version": "1.0"
        };

        defaultconf = {
                "server": {
                    "port": 1337,
                    "socketsPort": 1338,
                    "timeoutForRequests" : 60,

                    "serverRoot": ".",

                    "components": ["./components", "../rainjs/components"]
                },

                "defaultLanguage": "en_US",
                "language": "en_US",

                "languages": [
                    {"key": "en_US", "text": "English"},
                    {"key": "de_DE", "text": "Deutsch"},
                    {"key": "ro_RO", "text": "Română"},
                    {"key": "ar_SA", "text": "عربي"}
                ]
        };

        credentials = {
                "cookieSecret": "let it rain ;)"
        };

        //mock the fs
        fs = jasmine.createSpyObj('session', ['readdirSync', 'readFileSync']);
        fs.readdirSync = function () {
            var files=['default.conf', 'credentials.conf'];
            return files;
        };
        fs.readFileSync = function (file) {
            if(file.indexOf('default') !== -1) {
                return JSON.stringify(defaultconf);
            } else {
                return JSON.stringify(credentials);
            }
        };

        loadConfiguration = function(configPath) {
            process.env.RAIN_CONF = configPath;
            var mockConfiguration = loadModuleContext('/lib/configuration.js', {
                'commander': {}, 'fs': fs
            });
            return new mockConfiguration.Configuration();
        };
    });
    
    

    it('must set the language to the default one', function () {
        var configuration = loadConfiguration(configurationsFolder);
        expect(configuration.language).toBe('en_US');
    });

    it('must set the language to the one specified in the configuration', function () {
        defaultconf["language"] = 'ro_RO';
        var configuration = loadConfiguration(configurationsFolder);
        expect(configuration.language).toBe('ro_RO');
    });

    it('must throw an error when language is missing', function () {
        defaultconf = {
                "server": {
                    "port": 1337,
                    "socketsPort": 1338,
                    "timeoutForRequests" : 60,

                    "serverRoot": ".",

                    "components": ["./components", "../rainjs/components"]
                }
        };
        expect(function () {
            loadConfiguration(configurationsFolder);
        }).toThrowType(RainError.ERROR_PRECONDITION_FAILED);
    });

    it ('must throw an error if cookiesecret is missing', function () {
       credentials = {};
       expect(function () {
           loadConfiguration(configurationsFolder);
       }).toThrowType(RainError.ERROR_PRECONDITION_FAILED);
    });

    it ('must merge the credentials.conf and server.conf', function () {
        var configuration = loadConfiguration(configurationsFolder),
            merge = defaultconf;
        merge["cookieSecret"] = "let it rain ;)";
        for (var i in merge) {
            expect(configuration[i]).not.toBe(undefined);
        }
    });

    it ('must load an error component and loading component if none of the two is set', function () {
        var configuration = loadConfiguration(configurationsFolder);
        expect(configuration.loadingComponent).toEqual(defaultLoadingComponent);
        expect(configuration.errorComponent).toEqual(defaultErrorComponent);
    });

    it ('must load an error component and leave the loading component if it is set', function () {
        defaultconf["loadingComponent"] = {
                'id': 'testid',
                'component': 'testcomponent'
        };
        var configuration = loadConfiguration(configurationsFolder);
        expect(configuration.loadingComponent).toEqual(defaultconf["loadingComponent"]);
        expect(configuration.errorComponent).toEqual(defaultErrorComponent);
    });

    it ('must load a loading component and leave the error component if it is set', function () {
        defaultconf["errorComponent"] = {
                'id': 'testid',
                'component': 'testcomponent'
        };
        var configuration = loadConfiguration(configurationsFolder);
        expect(configuration.loadingComponent).toEqual(defaultLoadingComponent);
        expect(configuration.errorComponent).toEqual(defaultconf["errorComponent"]);
    });

    it ('must not load the default loading and error components if they are not set', function () {
        defaultconf["errorComponent"] = {
                'id': 'testid',
                'component': 'testcomponent'
        };
        defaultconf["loadingComponent"] = {
                'id': 'testid',
                'component': 'testcomponent'
        };
        var configuration = loadConfiguration(configurationsFolder);
        expect(configuration.loadingComponent).not.toEqual(defaultLoadingComponent);
        expect(configuration.errorComponent).not.toEqual(defaultErrorComponent);
        expect(configuration.errorComponent).toEqual(defaultconf["errorComponent"]);
        expect(configuration.errorComponent).toEqual(defaultconf["loadingComponent"]);
    });

});

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

var cwd = process.cwd();
var globals = require(cwd + '/lib/globals');
var configuration = require(cwd + '/lib/configuration');

describe('Error handler', function () {
    var mockComponentRegistry, componentRegistry,
        mockErrorHandler, errorHandler,
        mockConfiguration;

    beforeEach(function () {
        mockComponentRegistry = loadModuleContext('/lib/component_registry.js');
        mockComponentRegistry.scanComponentFolder();
        componentRegistry = new mockComponentRegistry.ComponentRegistry();

        mockConfiguration = {
            errorComponent: configuration.errorComponent
        };
        mockErrorHandler = loadModuleContext('/lib/error_handler.js', {
            './component_registry': componentRegistry,
            './configuration': mockConfiguration
        });
    });

    it('must throw an error when the error component is not found', function () {
        mockConfiguration.errorComponent = {};
        expect(function() {
            errorHandler = new mockErrorHandler.ErrorHandler();
        }).toThrow('No error component specified or default doesn\'t exist!');
    });

    it('must throw an error when the default view is not specified', function () {
        mockConfiguration.errorComponent = {
            id: 'example',
            version: '0.0.1'
        };
        expect(function() {
            errorHandler = new mockErrorHandler.ErrorHandler();
        }).toThrow('The error component doesn\'t have a default view!');
    });

    it('must return the default view when the status code is unknown', function () {
        errorHandler = new mockErrorHandler.ErrorHandler();
        var result = errorHandler.getErrorComponent('123');
        expect(result.component).toEqual(componentRegistry.getConfig('error', '1.0'));
        expect(result.view).toEqual('default');
    });

    it('must return the correct status code when it is known', function () {
        errorHandler = new mockErrorHandler.ErrorHandler();
        var result = errorHandler.getErrorComponent('400');
        expect(result.view).toEqual('400');
    });

});

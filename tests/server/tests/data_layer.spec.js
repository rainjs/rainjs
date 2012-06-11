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
var globals = require(cwd + '/lib/globals.js');
var config = require(cwd + '/lib/configuration.js');

describe('Data layer', function() {
    var mockComponentRegistry, componentRegistry,
        mockDataLayer, dataLayer;

    var error, context;

    beforeEach(function () {
        mockComponentRegistry = loadModuleContext('/lib/component_registry.js');
        mockComponentRegistry.scanComponentFolder();
        componentRegistry = new mockComponentRegistry.ComponentRegistry();

        var mocks = {
            './component_registry': componentRegistry
        };

        mockDataLayer = loadModuleContext('/lib/data_layer.js', mocks);

        dataLayer = new mockDataLayer.DataLayer();
    });

    function saveParameters(callbackError, callbackContext) {
        error = callbackError;
        context = callbackContext;
    }

    it('must throw an error when required arguments are missing or invalid', function () {
        var componentOpt = undefined;
        var finished = false;

        runs(function () {
            dataLayer.loadData(componentOpt, saveParameters);
            expect(error.message).toBe('Missing componentOptions in function loadData().');

            componentOpt = {};
            dataLayer.loadData(componentOpt, saveParameters);
            expect(error.message).toBe('Missing component id in function loadData().');

            componentOpt.id = 'button';
            dataLayer.loadData(componentOpt, saveParameters);
            expect(error.message).toBe('Missing view id in function loadData().');

            componentOpt.viewId = 'index';
            dataLayer.loadData(componentOpt, saveParameters);
            expect(error.message).toBe('Missing version in function loadData().');

            componentOpt.version = '1.0';
            expect(function () {
                dataLayer.loadData(componentOpt);
            }).toThrow('Missing callback in function loadData().');

            componentOpt.id = 'inexistent';
            dataLayer.loadData(componentOpt, saveParameters);
            expect(error.message).toBe('Component inexistent-1.0 doesn\'t exist.');

            componentOpt.id = 'button';
            componentOpt.viewId = 'no_view';
            dataLayer.loadData(componentOpt, saveParameters);
            expect(error.message).toBe('View no_view doesn\'t exists in meta.json.');

            componentOpt.viewId = 'index';
            componentOpt.context = 'my_data';
            componentRegistry.getConfig('button', '1.0').folder = 'path';
            dataLayer.loadData(componentOpt, function () {
                saveParameters(arguments[0], arguments[1]);
                finished = true;
            });
        });

        waitsFor(function () {
            return finished;
        }, 'Callback was\'t called.');

        runs(function () {
            expect(error).toBeNull();
            expect(context).toBe('my_data');
        });
    });

    it('must call the server-side data function for the view', function () {
        var componentOpt = {
            id: 'button',
            version: '1.0',
            viewId: 'level3',
            context: 'my_data'
        };
        var finished = false;

        runs(function () {
            dataLayer.loadData(componentOpt, function () {
                saveParameters(arguments[0], arguments[1]);
                finished = true;
            });
        });

        waitsFor(function () {
            return finished;
        }, 'Callback was\'t called.');

        runs(function () {
            expect(error).toBeNull();
            expect(context.old_data).toBe('my_data');
            expect(context.new_data).toBe('my_new_data');
        });
    });
});

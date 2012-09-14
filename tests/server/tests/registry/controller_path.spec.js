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
    fs = require('fs'),
    controllerPathPlugin = loadModuleExports('/lib/registry/controller_path.js');

describe('Registry Plugin: ' + controllerPathPlugin.name, function () {
    var componentConfig = null;

    beforeEach(function () {
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

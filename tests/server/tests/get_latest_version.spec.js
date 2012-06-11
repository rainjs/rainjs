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

describe('Get latest version', function() {
    var mockComponentRegistry, componentRegistry;

    beforeEach(function () {
        mockComponentRegistry = loadModuleContext('/lib/component_registry.js');
        mockComponentRegistry.scanComponentFolder();
        componentRegistry = new mockComponentRegistry.ComponentRegistry();
    });

    it('must get the correct version', function () {
        expect(componentRegistry.getLatestVersion('example', '0.0.1')).toEqual('0.0.1');
        expect(componentRegistry.getLatestVersion('example')).toEqual('4.5.2');
        expect(componentRegistry.getLatestVersion('example', '1.3')).toEqual('1.3.5');
        expect(componentRegistry.getLatestVersion('example', '1')).toEqual('1.3.5');
        expect(componentRegistry.getLatestVersion('example', '2')).toEqual('2.0.1');
    });

    it('must be undefined version', function () {
        expect(componentRegistry.getLatestVersion('example', '6')).toBeUndefined();
        expect(componentRegistry.getLatestVersion('example_dosnt_exist')).toBeUndefined();
        expect(componentRegistry.getLatestVersion('example', '3')).toBeUndefined();
    });
});

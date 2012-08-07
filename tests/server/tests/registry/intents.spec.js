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

describe('Registry Plugin: Intents', function () {
    var component, intentRegistry, registryPlugin;

    beforeEach(function(){
        var mocks = {};
        intentRegistry = mocks['../intent_registry'] =
            jasmine.createSpyObj('intentRegistry', ['register']);
        mocks['../logging'] = jasmine.createSpyObj('logging', ['get']);
        mocks['../logging'].get.andReturn({warn: function () {}});

        registryPlugin = loadModuleExports('lib/registry/intents.js', mocks);

        component = {
            id: 'example',
            version: '1.0',
            views: {},
            intents: [{
                category: 'com.rain.test',
                action: 'SHOW_CHAT',
                provider: 'index'
            },
            {
                category: 'com.rain.test',
                action: 'LOG',
                provider: 'index.js#log'
            }]
        };
    });

    it('should register 2 intents', function () {
        registryPlugin.configure(component);

        expect(intentRegistry.register).toHaveBeenCalledWith(component, component.intents[0]);
        expect(intentRegistry.register).toHaveBeenCalledWith(component, component.intents[1]);
        expect(intentRegistry.register.calls.length).toEqual(2);
    });

    it('should not register intents for containers', function () {
        component.type = 'container';

        registryPlugin.configure(component);

        expect(intentRegistry.register).not.toHaveBeenCalled();
    });
});

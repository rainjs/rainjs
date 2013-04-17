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

describe('Module Loader', function () {
    var content = 'module.exports = function () {}',
        modulePath = '/path/to/module.js',
        component = {id: 'example', version: '1.0'},
        ModuleLoader, fs, vm, Module, logging, Translation, script;

    beforeEach(function () {
        var mocks = {};
        fs = mocks['fs'] = jasmine.createSpyObj('fs', ['readFileSync']);
        vm = mocks['vm'] = jasmine.createSpyObj('vm', ['createScript']);
        Module = mocks['module'] = jasmine.createSpy('Module');
        logging = mocks['./logging'] = jasmine.createSpyObj('logging', ['get']);
        Translation = mocks['./translation'] = jasmine.createSpyObj('Translation', ['get']);

        fs.readFileSync.andReturn(content);

        script = jasmine.createSpyObj('script', ['runInNewContext']);
        vm.createScript.andReturn(script);

        Module.andReturn({require: function () {}});
        Module._nodeModulePaths = jasmine.createSpy('_nodeModulePaths');

        logging.get.andReturn({});

        var translation = {generateContext: jasmine.createSpy('generateContext')};
        translation.generateContext.andReturn({
            t: jasmine.createSpy('t'),
            nt: jasmine.createSpy('nt')
        });
        Translation.get.andReturn(translation);

        ModuleLoader = loadModuleExports('/lib/module_loader.js', mocks);
    });

    it('should create a new context for the specified parameters', function () {
        var loader = new ModuleLoader();

        loader.requireWithContext(modulePath, component, 'en_US');

        expect(fs.readFileSync).toHaveBeenCalledWith(modulePath, 'utf8');
        expect(vm.createScript).toHaveBeenCalledWith(content, modulePath);
        expect(Translation.get().generateContext).toHaveBeenCalledWith(component, 'en_US');
        expect(logging.get).toHaveBeenCalledWith(component);
        expect(Module).toHaveBeenCalledWith(modulePath);
        expect(script.runInNewContext).toHaveBeenCalled();

        var sandbox = script.runInNewContext.mostRecentCall.args[0];
        expect(sandbox.t).toBeDefined();
        expect(sandbox.nt).toBeDefined();
        expect(sandbox.logger).toBeDefined();
    });

    it('should reuse the cached script when the language changes', function () {
        var loader = new ModuleLoader();

        loader.requireWithContext(modulePath, component, 'en_US');
        loader.requireWithContext(modulePath, component, 'ro_RO');

        expect(fs.readFileSync.calls.length).toEqual(1);
        expect(vm.createScript.calls.length).toEqual(1);
        expect(Translation.get().generateContext).toHaveBeenCalledWith(component, 'en_US');
        expect(Translation.get().generateContext).toHaveBeenCalledWith(component, 'ro_RO');
        expect(logging.get).toHaveBeenCalledWith(component);
        expect(logging.get.calls.length).toEqual(2);
        expect(Module.calls.length).toEqual(2);
        expect(script.runInNewContext.calls.length).toEqual(2);
    });

    it('should return the cached module', function () {
        var loader = new ModuleLoader();

        loader.requireWithContext(modulePath, component, 'en_US');
        loader.requireWithContext(modulePath, component, 'en_US');

        expect(fs.readFileSync.calls.length).toEqual(1);
        expect(vm.createScript.calls.length).toEqual(1);
        expect(Translation.get().generateContext.calls.length).toEqual(1);
        expect(logging.get.calls.length).toEqual(1);
        expect(Module.calls.length).toEqual(1);
        expect(script.runInNewContext.calls.length).toEqual(1);
    });
});

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
    var Translation, logging, fs, module, loader, component, t, nt, logger;

    beforeEach(function () {
        component = {id: 'test', version: '1.0'};

        t = jasmine.createSpy('t');
        nt = jasmine.createSpy('nt');
        logger = { debug: jasmine.createSpy('debug') };

        var modules = {
            '/dir/module.js': 'exports.fn = function () { return "foo"; };',
            '/dir1/custom_module.js': 'module.exports = { t: t, nt: nt, logger: logger };',
            '/dir/async_module.js':
                'exports.fn = function (cb) { process.nextTick(function () { cb(t()); }); };',
            '/dir/filename_module.js':
                'module.exports = { __filename: __filename, __dirname: __dirname };',
            '/dir/require_test.js': 'exports.require = require;',
            '/dir/submodule_test.js': 'module.exports = require("../dir1/custom_module");',
            '/dir/async_submodule.js': 'var mod = require("./async_module");\n' +
                'exports.fn = function (cb) { mod.fn(cb); };',
            '/dir/node_module_test.js': 'require("test");',
            '/dir/json_test.js': 'require("./test.json");',
            '/dir/not_found_test.js': 'require("./test");',
            '/dir/shebang_test.js': '#!/usr/bin/env node\n' +
                'module.exports = 1;'
        };

        var mocks = {};

        fs = mocks['fs'] = jasmine.createSpyObj('fs', ['readFileSync', 'existsSync']);
        fs.readFileSync.andCallFake(function (filename) {
            var module = modules[filename];

            if (!module) {
                throw new Error('File not found: ' + filename);
            }

            return module;
        });
        fs.existsSync.andCallFake(function (filename) {
            return typeof modules[filename] !== 'undefined';
        });

        Translation = mocks['./translation'] = jasmine.createSpyObj('Translation', ['get']);
        Translation.get.andReturn(jasmine.createSpyObj('translation', ['generateContext']));
        Translation.get().generateContext.andReturn({
            t: t,
            nt: nt
        });

        logging = mocks['./logging'] = jasmine.createSpyObj('logging', ['get']);
        logging.get.andReturn(logger);


        var Module = mocks['module'] = jasmine.createSpy('Module');
        Module._nodeModulePaths = function () {};
        Module.andCallFake(function () {
            module = jasmine.createSpyObj('module', ['require']);
            module.exports = {};
            return module;
        });

        var ModuleLoader = loadModuleExports('/lib/module_loader.js', mocks);
        loader = new ModuleLoader();
    });

    it('should load a module', function () {
        var exports = loader.requireWithContext('/dir/module.js', component, 'en_US');

        expect(exports.fn()).toEqual('foo');
    });

    it('should accept only absolute paths', function () {
        expect(function () {
            loader.requireWithContext('./module.js', component, 'en_US');
        }).toThrow();
    });

    it('should accept only files with .js extension', function () {
        expect(function () {
            loader.requireWithContext('/dir/module.json', component, 'en_US');
        }).toThrow();
    });

    it('should inject t, nt and logger into the loaded module', function () {
        var exports = loader.requireWithContext('/dir1/custom_module.js', component, 'en_US');

        expect(exports.t).toEqual(t);
        expect(exports.nt).toEqual(nt);
        expect(exports.logger).toEqual(logger);
        expect(Translation.get().generateContext).toHaveBeenCalledWith(component, 'en_US');
        expect(logging.get).toHaveBeenCalledWith(component);
    });

    it('should pass __filename and __diranme', function () {
        var exports = loader.requireWithContext('/dir/filename_module.js', component, 'en_US');

        expect(exports.__filename).toEqual('/dir/filename_module.js');
        expect(exports.__dirname).toEqual('/dir');
    });

    it('should provide the require method to the loaded module', function () {
        var exports = loader.requireWithContext('/dir/require_test.js', component, 'en_US');
        expect(exports.require).toEqual(jasmine.any(Function));
    });

    it('should load sub-modules', function () {
        var exports = loader.requireWithContext('/dir/submodule_test.js', component, 'en_US');

        expect(exports.t).toBeDefined();
        expect(exports.nt).toBeDefined();
        expect(exports.logger).toBeDefined();
    });

    it('should preserve the same context after async call', function () {
        testAsyncCall('/dir/async_module.js');
    });

    it('should preserve the same context after async call for sub-modules', function () {
        testAsyncCall('/dir/async_submodule.js');
    });

    function testAsyncCall (filename) {
        var callback1, callback2;

        runs(function () {
            Translation.get().generateContext.andCallFake(function (component, language) {
                return {
                    t: function () { return language; },
                    nt: function () { return language; }
                }
            });

            callback1 = jasmine.createSpy('callback1');
            callback2 = jasmine.createSpy('callback2');

            var exports1 = loader.requireWithContext(filename, component, 'en_US');
            exports1.fn(callback1);

            var exports2 = loader.requireWithContext(filename, component, 'de_DE');
            exports2.fn(callback2);
        });

        waitsFor(function () {
            return callback1.calls.length !== 0 && callback2.calls.length != 0;
        });

        runs(function () {
            expect(callback1).toHaveBeenCalledWith('en_US');
            expect(callback2).toHaveBeenCalledWith('de_DE');
        });
    }

    it('should use Node\'s require for core and node modules', function () {
        loader.requireWithContext('/dir/node_module_test.js', component, 'en_US');
        expect(module.require).toHaveBeenCalledWith('test');
    });

    it('should use Node\'s require for non js files', function () {
        loader.requireWithContext('/dir/json_test.js', component, 'en_US');
        expect(module.require).toHaveBeenCalledWith('./test.json');
    });

    // if a module request doesn't have the extension specified, this loader will try
    // only .js, Node's require will also try .json and .node
    it('should use Node\'s require for not found modules', function () {
        loader.requireWithContext('/dir/not_found_test.js', component, 'en_US');
        expect(module.require).toHaveBeenCalledWith('./test');
    });

    it('should remove shebang', function () {
        var exports = loader.requireWithContext('/dir/shebang_test.js', component, 'en_US');
        expect(exports).toEqual(1);
    });

    it('should return the cached module', function () {
        loader.requireWithContext('/dir1/custom_module.js', component, 'en_US');
        loader.requireWithContext('/dir1/custom_module.js', component, 'en_US');

        expect(fs.readFileSync.calls.length).toEqual(1);
    });
});

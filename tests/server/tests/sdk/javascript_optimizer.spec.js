// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of
// conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
// 3. Neither the name of The author nor the names of its contributors may be used to endorse or
// promote products derived from this software without specific prior written permission.
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


'use strict';

describe('JavaScript Optimizer', function () {
    var JsOptimizer, components, requirejs, util, fs, wrench;

    beforeEach(function () {
        var mocks = {};

        components = {
            'core;1.0': {
                id: 'core',
                version: '1.0',
                path: '/usr/rain/components/core',
                folder: 'core',
                config: {}
            },
            'example;2.0': {
                id: 'example',
                version: '2.0',
                path: '/usr/rain/components/example_list',
                folder: 'example_list',
                config: {
                    views: {
                        index: {},
                        notes: {}
                    }
                }
            },
            'external;3.1': {
                id: 'external',
                version: '3.1',
                path: '/usr/project/components/external',
                folder: 'external',
                config: {}
            }
        };

        mocks['fs'] = fs = jasmine.createSpyObj('fs',
            ['existsSync', 'writeFileSync', 'readFileSync']);
        mocks['wrench'] = wrench = jasmine.createSpyObj('wrench', ['mkdirSyncRecursive']);
        mocks['requirejs'] = requirejs = jasmine.createSpyObj('requirejs', ['optimize']);
        mocks['../../lib/util'] = util = jasmine.createSpyObj('util', ['walkSync']);
        util.format = require('util').format;

        JsOptimizer = loadModuleExports('/bin/lib/javascript_optimizer.js', mocks);
    });

    it('should generate the configuration for the core component', function () {
        util.walkSync.andCallFake(function (jsPath, extensions, callback) {
            callback('/usr/rain/components/core/client/js/lib/require-jquery.js');
            callback('/usr/rain/components/core/client/js/raintime.js');
            callback('/usr/rain/components/core/client/js/renderer.js');
            callback('/usr/rain/components/core/client/js/lib/promise.js');
        });

        var optimizer = new JsOptimizer({
            includedComponents: ['core;1.0'],
            components: components
        });
        optimizer.run();

        expect(requirejs.optimize).toHaveBeenCalled();
        var options = requirejs.optimize.calls[0].args[0];
        expect(options.include).toEqual(['raintime', 'raintime/renderer', 'raintime/lib/promise']);
        expect(options.out).toEqual('/usr/rain/components/core/client/js/index.min.js');
    });

    it('should generate the configuration for a regular component', function () {
        util.walkSync.andCallFake(function (jsPath, extensions, callback) {
            callback('/usr/rain/components/example_list/client/js/index.js');
            callback('/usr/rain/components/example_list/client/js/lib/note.js');
        });

        var optimizer = new JsOptimizer({
            includedComponents: ['example;2.0'],
            components: components
        });
        optimizer.run();

        expect(requirejs.optimize).toHaveBeenCalled();
        var options = requirejs.optimize.calls[0].args[0];
        expect(options.include).toEqual(['js/index', 'js/lib/note']);
        expect(options.out).toEqual('/usr/rain/components/example_list/client/js/index.min.js');
    });

    it('should optimize the specified components', function () {
        var optimizer = new JsOptimizer({
            includedComponents: ['core;1.0', 'example;2.0'],
            components: components
        });
        optimizer.run();

        expect(requirejs.optimize.calls.length).toEqual(2);
    });

    it('should write the files in the minified project', function () {
        var optimizer = new JsOptimizer({
            includedComponents: ['core;1.0', 'example;2.0'],
            components: components,
            outputPath: '/min/rain'
        });
        optimizer.run();

        expect(requirejs.optimize.calls[0].args[0].out)
            .toEqual('/min/rain/components/core/client/js/index.min.js');
        expect(requirejs.optimize.calls[1].args[0].out)
            .toEqual('/min/rain/components/example_list/client/js/index.min.js');
    });

    it('should modify meta.json when output path is specified', function () {
        fs.existsSync.andCallFake(function (file) {
            return file === '/usr/rain/components/example_list/client/js/index.js';
        });

        var optimizer = new JsOptimizer({
            includedComponents: ['example;2.0'],
            components: components,
            outputPath: '/min/rain'
        });
        optimizer.run();

        expect(fs.writeFileSync).toHaveBeenCalled();
        var config = JSON.parse(fs.writeFileSync.calls[0].args[1]);
        expect(config.views.index.controller.client).toEqual('index.js');
        expect(config.views.notes).toEqual({});
    });

    it('should not modify the meta.json when the output path is not specified', function () {
        fs.existsSync.andCallFake(function (file) {
            return file === '/usr/rain/components/example_list/client/js/index.js';
        });

        var optimizer = new JsOptimizer({
            includedComponents: ['example;2.0'],
            components: components
        });
        optimizer.run();

        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should copy the excluded files', function () {
        util.walkSync.andCallFake(function (jaPath, extensions, callback) {
            callback('/usr/rain/components/core/client/js/lib/require-jquery.js');
            callback('/usr/rain/components/core/client/js/lib/jquery_plugins.js');
            callback('/usr/rain/components/core/client/js/lib/es5-shim.min.js');
            callback('/usr/rain/components/core/client/js/lib/promise.js');
        });

        var optimizer = new JsOptimizer({
            includedComponents: ['core;1.0'],
            components: components,
            outputPath: '/min/rain'
        });
        optimizer.run();

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            '/min/rain/components/core/client/js/lib/require-jquery.js', undefined);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            '/min/rain/components/core/client/js/lib/jquery_plugins.js', undefined);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            '/min/rain/components/core/client/js/lib/es5-shim.min.js', undefined);
        expect(fs.writeFileSync).not.toHaveBeenCalledWith(
            '/min/rain/components/core/client/js/lib/promise.js', undefined);
    });

    it('should add dummy define for global modules', function () {
        var optimizer = new JsOptimizer({
            includedComponents: ['example;2.0'],
            components: components
        });
        optimizer.run();

        var options = requirejs.optimize.calls[0].args[0];
        var contents = options.onBuildRead(
            'js/lib/jquery',
            '/usr/rain/components/example_list/client/js/lib/jquery.js',
            'window.foo = "bar";'
        );

        expect(contents.indexOf('define(')).not.toEqual(-1);
        expect(contents.indexOf('js/lib/jquery')).not.toEqual(-1);
    });

    it('should exclude dependencies to the current component', function () {
        var optimizer = new JsOptimizer({
            includedComponents: ['example;2.0'],
            components: components
        });
        optimizer.run();

        var options = requirejs.optimize.calls[0].args[0];

        expect(options.excludeShallow.indexOf('example/2.0/js/index')).toEqual(-1);

        options.onBuildRead(
            'example/2.0/js/index',
            '/usr/rain/components/example_list/client/js/index.js',
            'define(function () {});'
        );

        expect(options.excludeShallow.indexOf('example/2.0/js/index')).not.toEqual(-1);
    });

    it('should exclude external dependencies', function () {
        var optimizer = new JsOptimizer({
            includedComponents: ['example;2.0'],
            components: components
        });
        optimizer.run();

        var options = requirejs.optimize.calls[0].args[0];
        options.pkgs = {};

        options.onBuildRead(
            'js/index',
            '/usr/rain/components/example_list/client/js/index.js',
            'define(["external/3.1/js/index"], function () {});'
        );

        expect(options.excludeShallow.indexOf('external/3.1/js/index')).not.toEqual(-1);
        expect(options.packages[options.packages.length -1]).toEqual({
            name: 'external/3.1',
            main: 'js/index',
            location: '/usr/project/components/external/client'
        });
    });

    it('should write the correct module name', function () {
        var optimizer = new JsOptimizer({
            includedComponents: ['example;2.0'],
            components: components
        });
        optimizer.run();

        var options = requirejs.optimize.calls[0].args[0];

        var contents = options.onBuildWrite(
            'js/index',
            '/usr/rain/components/example_list/client/js/index.js',
            'define("js/index", [], function () {});'
        );

        expect(contents.indexOf('example/2.0/js/index')).not.toEqual(-1);
    });
});

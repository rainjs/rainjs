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

describe('the component class', function () {
    var module, mocks, fs, path, wrench, stat,
        root = '/root';

    beforeEach(function () {
        mocks = {};
        path = mocks['path'] = jasmine.createSpyObj('path', ['join', 'resolve', 'basename']);
        fs = mocks['fs'] = jasmine.createSpyObj('fs',
                ['mkdirSync', 'readdirSync', 'statSync',
                 'readFileSync', 'writeFileSync', 'existsSync']);
        wrench = mocks['wrench'] = jasmine.createSpyObj('wrench', ['copyDirSyncRecursive']);
        mocks['/root'] = {
            id: 'c',
            version: '1.0'
        };

        module = loadModuleExports('bin/lib/component.js', mocks);
        spyOn(module, 'create');
        spyOn(module, '_updatePlaceholders');

        stat = jasmine.createSpyObj('stat', ['isDirectory']);
        stat.isDirectory.andReturn(true);
        fs.statSync.andReturn(stat);

        fs.readdirSync.andReturn(['a', 'b', 'c']);

        path.join.andReturn(root);
        path.resolve.andReturn(root);
    });

    describe('create', function() {
        it('should throw an error if the component path already exists', function () {
            module.create.andCallThrough();
            fs.existsSync.andReturn(true);

            expect(function () {
                module.create(root, 'test', '1.0');
            }).toThrow();
        });

        it('should create the component', function () {
            module.create.andCallThrough();

            module.create(root, 'test', '1.0');

            expect(fs.mkdirSync).toHaveBeenCalledWith(root, '0755');
            expect(wrench.copyDirSyncRecursive).toHaveBeenCalledWith(root, root);
            expect(module._updatePlaceholders.calls[0].args).toEqual([root, {
                'component_name': 'test',
                'component_version': '1.0'
            }]);
            expect(module._updatePlaceholders.calls[1].args).toEqual([root, {
                'component_name': 'test'
            }]);
        });
    });

    it('should update placeholders', function () {
        fs.readFileSync.andReturn("Hello {{name}}");
        module._updatePlaceholders.andCallThrough();

        module._updatePlaceholders('/file.html', {name: 'John'});

        expect(fs.writeFileSync).toHaveBeenCalledWith('/file.html', 'Hello John', 'utf8');
    });
});

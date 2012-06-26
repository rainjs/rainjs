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

describe('RAIN create project', function () {
    var module, program, mocks, path, fs, wrench, utils, createProject, component;
    var projectName = 'test',
        projectPath = '/home/user';
    var json = {
        name: 'test',
        version: '0.0.1',
        dependencies: [],
        keywords: ['test']
    };

    beforeEach(function () {
        mocks = {};
        path = mocks['path'] = jasmine.createSpyObj('path', ['join', 'resolve', 'existsSync', 'basename']);
        fs = mocks['fs'] = jasmine.createSpyObj('fs', ['mkdirSync', 'writeFileSync']);
        wrench = mocks['wrench'] = jasmine.createSpyObj('wrench', ['mkdirSyncRecursive', 'copyDirSyncRecursive']);
        utils = mocks['../lib/utils'] = jasmine.createSpyObj('utils', ['getProjectRoot']);
        component = mocks['../lib/component'] = jasmine.createSpyObj('component', ['create']);

        spyOn(console, 'log');
        spyOn(process, 'exit');
        spyOn(JSON, 'stringify')

        var context = loadModuleContext('bin/commands/create_project.js', mocks, { __dirname: '/dir' });
        module = context.module.exports;
        createProject = context.createProject;

        program = jasmine.createSpyObj('program', ['command', 'description', 'action', 'option']);
        program.command.andReturn(program);
        program.description.andReturn(program);
        program.action.andReturn(program);
        program.option.andReturn(program);

        path.resolve.andCallFake(function (s) {
            return s === '.' ? '/home/user' : s;
        });
        path.join.andCallFake(function () {
            return Array.prototype.slice.call(arguments, 0).join('/');
        });
        path.basename.andReturn(projectName);
        JSON.stringify.andReturn('json');
    });

    it('should register the create-project command', function () {
        module(program);

        expect(program.command).toHaveBeenCalledWith('create-project <project-name> [path]');
        expect(program.description).toHaveBeenCalledWith(jasmine.any(String));
        expect(program.action).toHaveBeenCalledWith(createProject);
        expect(program.option).not.toHaveBeenCalled();
    });

    it('should create a new project (default path)', function () {
        utils.getProjectRoot.andThrow(new Error('The specified path is not a RAIN project.'));
        path.existsSync.andReturn(false);

        createProject(projectName);

        expect(path.resolve).toHaveBeenCalledWith('.');
        expectProjectToHaveBeenCreated();
    });

    it('should create a new project (specified path)', function () {
        utils.getProjectRoot.andThrow(new Error('The specified path is not a RAIN project.'));
        path.existsSync.andReturn(false);

        createProject(projectName, projectPath);

        expect(path.resolve).toHaveBeenCalledWith(projectPath);
        expectProjectToHaveBeenCreated();
    });

    it('should fail if the project directory is inside an existing project', function () {
        utils.getProjectRoot.andReturn('/home');
        path.existsSync.andReturn(false);

        createProject(projectName);

        expect(process.exit).toHaveBeenCalled();
    });

    it('should fail if the project directory already exists', function () {
        utils.getProjectRoot.andThrow(new Error('The specified path is not a RAIN project.'));
        path.existsSync.andReturn(true);

        createProject(projectName);

        expect(process.exit).toHaveBeenCalled();
    });

    it('should fail if can not write to disk' , function () {
        utils.getProjectRoot.andThrow(new Error('The specified path is not a RAIN project.'));
        path.existsSync.andReturn(false);
        fs.mkdirSync.andThrow(new Error('IO error'));

        createProject(projectName);

        expect(process.exit).toHaveBeenCalled();
    });

    function expectProjectToHaveBeenCreated() {
        expect(utils.getProjectRoot).toHaveBeenCalledWith(path.join(projectPath, projectName));
        expect(path.existsSync).toHaveBeenCalledWith(path.join(projectPath, projectName));

        expect(wrench.mkdirSyncRecursive)
            .toHaveBeenCalledWith(path.join(projectPath, projectName), '0755');

        expect(fs.mkdirSync)
            .toHaveBeenCalledWith(path.join(projectPath, projectName, 'components'), '0755');
        expect(fs.mkdirSync)
            .toHaveBeenCalledWith(path.join(projectPath, projectName, 'conf'), '0755');
        expect(fs.mkdirSync)
            .toHaveBeenCalledWith(path.join(projectPath, projectName, 'log'), '0755');

        expect(wrench.copyDirSyncRecursive)
            .toHaveBeenCalledWith('/dir/../init/conf', path.join(projectPath, projectName, 'conf'));

        expect(JSON.stringify).toHaveBeenCalledWith(json, null, 4);
        expect(fs.writeFileSync)
            .toHaveBeenCalledWith(path.join(projectPath, projectName, 'package.json'), 'json\n');

        expect(fs.writeFileSync).toHaveBeenCalledWith(path.join(projectPath, projectName, '.rain'), '');

        expect(component.create)
            .toHaveBeenCalledWith(path.join(projectPath, projectName), 'hello_world', '1.0');
    }
});


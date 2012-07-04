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

describe('RAIN create component', function () {
    var mocks, program, utils, component, module, createComponent;

    beforeEach(function () {
        mocks = {};
        utils = mocks['../lib/utils'] = jasmine.createSpyObj('utils', ['getProjectRoot']);
        component = mocks['../lib/component'] = jasmine.createSpyObj('component', ['create']);

        spyOn(console, 'log');
        spyOn(process, 'exit');

        program = jasmine.createSpyObj('program', ['command', 'description', 'action', 'option']);
        program.command.andReturn(program);
        program.description.andReturn(program);
        program.action.andReturn(program);
        program.option.andReturn(program);
        component.create.andReturn({
            id: 'test',
            version: '1.0'
        });

        var context = loadModuleContext('bin/commands/create_component.js', mocks);
        module = context.module.exports;
        createComponent = context.createComponent;
    });

    it('should register the create-component command', function () {
        module(program);

        expect(program.command).toHaveBeenCalledWith('create-component <component-name> [component-version]');
    });

    it('should create a new component', function () {
        utils.getProjectRoot.andReturn('/root');

        createComponent('test', '1.0');
        expect(component.create).toHaveBeenCalledWith('/root', 'test', '1.0');
    });

    it('should exit in case it cannot create the component and print the error', function () {
        component.create.andThrow(new Error('Some funky error'));

        try {
            createComponent('test', '1.0');
        } catch (e) {
            // avoid crash due to execution not stopping at process.exit();
        }

        expect(process.exit).toHaveBeenCalledWith(1);
    });
});

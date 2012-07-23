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

describe('RAIN generate .po files', function () {
    var mocks, program, module, generateLocalizationFiles, generate;

    beforeEach(function () {
        mocks = {};
        generateLocalizationFiles = jasmine.createSpy();
        mocks['../lib/generate_po_utils'] = function () {
            this.generateLocalizationFiles = generateLocalizationFiles;
        };

        program = jasmine.createSpyObj('program', ['command', 'description', 'action', 'option']);
        program.command.andReturn(program);
        program.description.andReturn(program);
        program.action.andReturn(program);
        program.option.andReturn(program);

        var context = loadModuleContext('bin/commands/generate_po_files.js', mocks);
        module = context.module.exports;
        generate = context.generate;
    });

    it('should register the generate_po_files command', function () {
        module(program);
        expect(program.command).toHaveBeenCalledWith(
            'generate-po-files <output-locales> [component-id]');
    });

    it('should call the generate po utility function', function () {
        generate('en_US', 'test;1.0');
        expect(generateLocalizationFiles).toHaveBeenCalledWith('en_US', 'test;1.0');
    });

});

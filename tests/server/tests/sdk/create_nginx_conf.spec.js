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

describe('Generate Nginx Conf', function () {

    var fs, mocks = {},
        nginxGenerator, program, module, generate;

    beforeEach(function () {
        spyOn(process, 'exit');

        fs = jasmine.createSpyObj('fs', ['readFileSync'])

        mocks['fs'] = fs;

        fs.readFileSync.andCallFake(function () {
            return JSON.stringify({
                "fake": "fake"
            });
        });

        nginxGenerator = function () {};

        nginxGenerator.prototype.run = jasmine.createSpy('run');

        mocks['../lib/nginx_generator'] = nginxGenerator;

        program = jasmine.createSpyObj('program', ['command', 'description', 'action', 'option']);
        program.command.andReturn(program);
        program.description.andReturn(program);
        program.action.andReturn(program);
        program.option.andReturn(program);

        var context = loadModuleContext('bin/commands/create_nginx_conf.js', mocks);

        module = context.module.exports;
        generate = context.generateNginxConfiguration;

    });

    it('should register the create_nginx_conf', function () {
        module(program);
        expect(program.command).toHaveBeenCalledWith(
            'generate-nginx-conf');
    });

    it('should call the nginx generator', function () {
        generate();
        expect(nginxGenerator.prototype.run).toHaveBeenCalled();
    });
});
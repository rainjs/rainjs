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

var path = require('path'),
    cwd = process.cwd();

describe('raind', function () {
    var mocks, program, utils, server;

    beforeEach(function () {
        mocks = {};

        program = jasmine.createSpyObj('program', ['option', 'version', 'usage', 'parse']);
        utils = jasmine.createSpyObj('utils', ['getProjectRoot']);
        server = jasmine.createSpyObj('server', ['start']);

        program.dir = process.cwd();
        program.debug = false;

        program.usage.andReturn(program);
        program.version.andReturn(program);
        program.option.andReturn(program);

        mocks['commander'] = program;
        mocks['./lib/utils'] = utils;
        mocks[path.join(cwd, 'lib', 'server')] = server;

        spyOn(process, 'chdir');
        spyOn(process, 'kill');
        spyOn(process, 'exit');
    });

    it('should correctly setup the command line options', function () {
        loadModuleContext(path.join('bin', 'raind'), mocks);

        expect(program.version).toHaveBeenCalled();
        expect(program.option.calls.length).toBe(2);
        expect(program.option.calls[0].args).toEqual([
            '-d, --debug',
            'start the server in debug mode'
        ]);
        expect(program.option.calls[1].args).toEqual([
            '-D, --dir <path>',
            'the server working directory',
            process.cwd()
        ]);
    });

    it('should exit with error code 1 if the project dir is not inside a rain project', function () {
        utils.getProjectRoot.andCallFake(function () {
            throw new Error('this gets thrown when no valid path is found');
        });

        loadModuleExports(path.join('bin', 'raind'), mocks);

        expect(utils.getProjectRoot).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    if ('win32' !== process.platform) {
        it('should send a SIGUSR1 to itself to go into debug mode if -d is detected', function () {
            program.debug = true;

            loadModuleExports(path.join('bin', 'raind'), mocks);

            expect(process.kill).toHaveBeenCalledWith(process.pid, 'SIGUSR1');
        });
    }

    it('should not go into debug mode if -d is not present', function () {
        program.debug = false;

        loadModuleExports(path.join('bin', 'raind'), mocks);

        expect(process.kill).not.toHaveBeenCalled();
    });

    it('should initialize the server if all went well', function () {
        loadModuleExports(path.join('bin', 'raind'), mocks);
        expect(server.start).toHaveBeenCalled();
    });
});

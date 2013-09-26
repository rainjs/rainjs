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

var path = require('path');

describe('Generate Nginx Conf', function () {

    var fs,
        mocks = {},
        buildJson = {},
        NginxGenerator, program, module, generate;

    var cwd = process.cwd();

    beforeEach(function () {
        spyOn(process, 'exit');

        fs = jasmine.createSpyObj('fs', ['readFileSync'])
        mocks['fs'] = fs;
        fs.readFileSync.andCallFake(function () {
            return JSON.stringify({
                "fake": "fake"
            });
        });

        buildJson = {
            "additionalProjects": ["../rainjs", "../rainjs2"],
            "additionalProjectsProductionPaths": ["/opt/ui/lib/node_modules/rain/", "/opt/ui/lib/node_modules/rain2/"]
        }
        mocks[process.cwd() + '/build.json'] = buildJson;

        NginxGenerator = jasmine.createSpy('NginxGenerator');
        NginxGenerator.prototype.run = jasmine.createSpy('run');
        mocks['../lib/nginx_generator'] = NginxGenerator;

        program = jasmine.createSpyObj('program', ['command', 'description', 'action', 'option']);
        program.command.andReturn(program);
        program.description.andReturn(program);
        program.action.andReturn(program);
        program.option.andReturn(program);

        var context = loadModuleContext('bin/commands/create_nginx_conf.js', mocks);

        module = context.module.exports;
        generate = context.generateNginxConfiguration;

    });

    describe('register', function () {
        it('should register the create_nginx_conf', function () {
            module(program);
            expect(program.command).toHaveBeenCalledWith(
                'generate-nginx-conf [source-file] [destination-file] [production-path]');
        });
    });

    describe('calculating paths and composing the projects array', function () {
        it('should act correctly when a production path is provided', function () {
            generate('./bin/nginx.conf', './nginx.conf', '/opt/ui/rainjs-ssa');
            expect(NginxGenerator).toHaveBeenCalledWith({
                'projects' : [
                    { 'path' : cwd, 'productionPath' : '/opt/ui/rainjs-ssa' },
                    { 'path' : path.resolve(cwd, '../rainjs'), 'productionPath' : '/opt/ui/lib/node_modules/rain/' },
                    { 'path' : path.resolve(cwd, '../rainjs2'), 'productionPath' : '/opt/ui/lib/node_modules/rain2/' }
                ],
                'nginxConf' : { 'fake' : 'fake' },
                'destinationPath' : path.resolve(cwd, './nginx.conf')
            });

            expect(NginxGenerator.prototype.run).toHaveBeenCalled();
        });

        it('should act correctly when a production path is not provided', function () {
            generate('./bin/nginx.conf','./nginx.conf');
            expect(NginxGenerator).toHaveBeenCalledWith({
                'projects' : [
                    { 'path' : cwd, 'productionPath' : undefined },
                    { 'path' : path.resolve(cwd, '../rainjs'), 'productionPath' : undefined },
                    { 'path' : path.resolve(cwd, '../rainjs2'), 'productionPath' : undefined }
                ],
                'nginxConf' : { 'fake' : 'fake' },
                'destinationPath' : path.resolve(cwd, './nginx.conf')
            });

            expect(NginxGenerator.prototype.run).toHaveBeenCalled();
        });

        it('should act correctly when there are no additional projects', function () {
            buildJson = {};
            mocks[process.cwd() + '/build.json'] = buildJson;

            generate('./bin/nginx.conf','./nginx.conf','/opt/ui/rainjs-ssa');
            expect(NginxGenerator).toHaveBeenCalledWith({
                'projects' : [
                    { 'path' : cwd, 'productionPath' : '/opt/ui/rainjs-ssa' }
                ],
                'nginxConf' : { 'fake' : 'fake' },
                'destinationPath' : path.resolve(cwd, './nginx.conf')

            });

            expect(NginxGenerator.prototype.run).toHaveBeenCalled();
        });

        it('should act correctly when production paths are missing from the build.json file', function () {
            buildJson = {
                "additionalProjects": ["../rainjs", "../rainjs2"]
            }
            mocks[process.cwd() + '/build.json'] = buildJson;

            generate('./bin/nginx.conf','./nginx.conf', '/opt/ui/rainjs-ssa');

            expect(NginxGenerator).toHaveBeenCalledWith({
                'projects' : [
                    { 'path' : cwd, 'productionPath' : '/opt/ui/rainjs-ssa' },
                    { 'path' : path.resolve(cwd, '../rainjs'), 'productionPath' : undefined },
                    { 'path' : path.resolve(cwd, '../rainjs2'), 'productionPath' : undefined }
                ],
                'nginxConf' : { 'fake' : 'fake' },
                'destinationPath' : path.resolve(cwd, './nginx.conf')
            });

            expect(NginxGenerator.prototype.run).toHaveBeenCalled();
        });

    });

    describe('calling nginx generator', function() {
        it('should call the nginx generator correctly when no optional params are passed', function () {
            generate();
            expect(NginxGenerator).toHaveBeenCalledWith({
                projects : [
                    { path : '/home/fdobre/rainjs', productionPath : undefined },
                    { path : '/home/fdobre/rainjs', productionPath : undefined },
                    { path : '/home/fdobre/rainjs2', productionPath : undefined } ],
                    nginxConf : { fake : 'fake' },
                    destinationPath : 'nginx.conf'
            });
        });

        it('should call the nginx generator correctly when optional parameters are passed', function () {
            buildJson = {
                "additionalProjects": ["../rainjs", "../rainjs2"],
                "additionalProjectsProductionPaths": ["/opt/ui/lib/node_modules/rain/", "/opt/ui/lib/node_modules/rain2/"]
            }
            mocks[process.cwd() + '/build.json'] = buildJson;

            generate('./bin/nginx.conf','../nginx.conf', '/opt/ui/rainjs-ssa');
            expect(NginxGenerator).toHaveBeenCalledWith({
                'projects' : [
                    { 'path' : cwd, 'productionPath' : '/opt/ui/rainjs-ssa' },
                    { 'path' : path.resolve(cwd, '../rainjs'), 'productionPath' : "/opt/ui/lib/node_modules/rain/" },
                    { 'path' : path.resolve(cwd, '../rainjs2'), 'productionPath' : "/opt/ui/lib/node_modules/rain2/" }
                ],
                'nginxConf' : { 'fake' : 'fake' },
                'destinationPath' : path.resolve(cwd, '../nginx.conf')
            });

            expect(NginxGenerator.prototype.run).toHaveBeenCalled();

        });

    });
});

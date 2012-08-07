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

var cwd = process.cwd(),
    path = require('path'),
    Module = require('module'),
    util = require(cwd + '/lib/util'),
    socketRegistry = require(cwd + '/lib/socket_registry'),
    websockets = require(cwd + '/lib/registry/websockets');

var conf;

var socket = {
    channel: 'example',
    handle: function () {}
};

describe('Registry plugin: Websockets', function () {
    beforeEach(function () {
        spyOn(util, 'walkSync').andCallFake(function (folder, callback) {
            callback(path.join(folder, 'socket.js'));
        });

        // Mock for requireWithContext
        spyOn(global, 'requireWithContext').andCallFake(function (path) {
            return socket;
        });

        spyOn(socketRegistry, 'register').andCallFake(function (channel, handler) {});

        conf = {
            id: 'button',
            version: '2.0',
            folder: 'components/button2'
        };
    });

    it('should register sockets from the component/server/websockets directory', function () {
        websockets.configure(conf);

        var expectedFolder = path.join('components', 'button2', 'server', 'websockets');

        expect(util.walkSync).toHaveBeenCalled();
        expect(util.walkSync.mostRecentCall.args[0]).toBe(expectedFolder);
    });

    it('should require the websocket module', function () {
        websockets.configure(conf);

        var expectedPath = path.join('components', 'button2', 'server', 'websockets', 'socket.js');

        expect(global.requireWithContext.mostRecentCall.args[0]).toBe(expectedPath);
    });

    it('should register the socket', function () {
        websockets.configure(conf);

        expect(socketRegistry.register).toHaveBeenCalledWith('/button/2.0/example', socket.handle);
    });

    it('should not register the socket for containers', function () {
        conf.type = 'container';

        websockets.configure(conf);

        expect(socketRegistry.register).not.toHaveBeenCalled();
    });
});

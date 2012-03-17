"use strict";

var cwd = process.cwd();

var path = require('path');
var Module = require('module');
var util = require(cwd + '/lib/util');
var socketRegistry = require(cwd + '/lib/socket_registry');
var websockets = require(cwd + '/lib/registry/websockets');

var conf = {
    id: 'button',
    version: '2.0',
    folder: 'components/button2'
};

var socket = {
    channel: 'example',
    handle: function () {}
};

describe('Registry plugin: Websockets', function () {
    beforeEach(function () {
        spyOn(console, 'log').andCallFake(function () {});

        spyOn(util, 'walkSync').andCallFake(function (folder, callback) {
            callback(path.join(folder, 'socket.js'), 'socket.js');
        });

        // Mock for require.
        spyOn(Module.prototype, 'require').andCallFake(function (path) {
            return socket;
        });

        spyOn(socketRegistry, 'register').andCallFake(function (channel, handler) {});
    });

    it('must register sockets from the component/server/websockets directory', function () {
        websockets.configure(conf);

        var expectedFolder = path.join('components', 'button2', 'server', 'websockets');

        expect(util.walkSync).toHaveBeenCalled();
        expect(util.walkSync.mostRecentCall.args[0]).toBe(expectedFolder);
    });

    it('must require the websocket module', function () {
        websockets.configure(conf);

        var expectedFolder = path.join('components', 'button2', 'server',
                                       'websockets', 'socket.js');

        expect(Module.prototype.require).toHaveBeenCalledWith(expectedFolder);
    });

    it('must register the socket', function () {
        websockets.configure(conf);

        expect(socketRegistry.register).toHaveBeenCalledWith('/button/2.0/example', socket.handle);
    });
});

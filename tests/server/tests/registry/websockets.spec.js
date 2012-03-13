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
    folder: '/components/button2'
};

var socket = {
    channel: 'example',
    handle: function () {}
};

describe('Registry plugin: Websockets', function () {
    beforeEach(function () {        
        spyOn(util, 'walkDir').andCallFake(function (folder, callback) {
            callback(path.join(folder, 'socket.js'), 'socket.js');
        });
        
        //mock for require
        spyOn(Module.prototype, 'require').andCallFake(function (path) {
            return socket;
        });
        
        spyOn(socketRegistry, 'register').andCallFake(function (channel, handler) {});
    });
    
    it('should register sockets from the component/server/websockets directory', function () {
        websockets.configure(conf);
        
        expect(util.walkDir).toHaveBeenCalled();
        expect(util.walkDir.mostRecentCall.args[0]).toBe('/components/button2/server/websockets');
    });
    
    it('should require the websocket module', function () {
        websockets.configure(conf);
        
        expect(Module.prototype.require).toHaveBeenCalledWith('/components/button2/server/websockets/socket.js');
    });
    
    it('should register the socket', function () {
        websockets.configure(conf);
        
        expect(socketRegistry.register).toHaveBeenCalledWith('/button/2.0/example', socket.handle);
    });
});
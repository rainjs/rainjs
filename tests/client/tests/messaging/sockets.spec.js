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

'use strict';

describe('Socket Handler', function () {
    var deps = ['raintime/messaging/sockets', "raintime/lib/socket.io",
        "raintime/messaging/observer"];

    beforeEach(function () {
        window.rainContext = {
            cookieMaxAge: 30
        };
    });

    it('should establish the socket connection', deps, function (SocketHandler, io) {
        unmockSocketHandler(SocketHandler);
        mockSocketIO(io);

        var socketHandler = new SocketHandler(),
            baseUrl = window.location.protocol + '//' + window.location.host;

        socketHandler.getSocket('/core');

        expect(io.connect).toHaveBeenCalledWith(baseUrl + '/core', jasmine.any(Object));
    });

    it('should emit when socket is connected', deps, function (SocketHandler, io) {
        unmockSocketHandler(SocketHandler);
        var emit =  mockSocketIO(io).emit;

        var socketHandler = new SocketHandler();

        var socket = socketHandler.getSocket('/core');
        socket.isConnected = true;

        socket.emit('event', {foo: 'bar'});

        expect(emit).toHaveBeenCalledWith('event', {foo: 'bar'});
    });

    it('should wait for the socket to connect', deps, function (SocketHandler, io) {
        unmockSocketHandler(SocketHandler);
        var emit =  mockSocketIO(io).emit;

        var socketHandler = new SocketHandler();

        var socket = socketHandler.getSocket('/core');

        socket.emit('event', {foo: 'bar'});

        expect(emit).not.toHaveBeenCalled();

        socket.callHandlers('connect');

        expect(emit).toHaveBeenCalledWith('event', {foo: 'bar'});
    });

    it('should reconnect the socket', deps, function (SocketHandler, io) {
        unmockSocketHandler(SocketHandler);
        mockSocketIO(io);

        var socketHandler = new SocketHandler();

        var socket = socketHandler.getSocket('/core');
        socket.isConnected = true;

        socket.callHandlers('disconnect');

        socket.emit('event', {foo: 'bar'});

        expect(socket.socket.reconnect).toHaveBeenCalled();
    });

    it('should update cookie if ws messages were sent', deps, function (SocketHandler, io) {
        unmockSocketHandler(SocketHandler);
        mockSocketIO(io);

        spyOn(window, 'setInterval');

        var callback;

        window.setInterval.andCallFake(function (fn) {
            callback = fn;
        });

        var socketHandler = new SocketHandler();

        var socket = socketHandler.getSocket('/core');
        socket.isConnected = true;

        io.SocketNamespace.prototype.emit('event', {foo: 'bar'});

        callback();

        expect($.ajax).toHaveBeenCalled();
    });

    it('should update cookie if ws messages were received', deps, function (SocketHandler, io) {
        unmockSocketHandler(SocketHandler);
        mockSocketIO(io);

        spyOn(window, 'setInterval');

        var callback;

        window.setInterval.andCallFake(function (fn) {
            callback = fn;
        });

        var socketHandler = new SocketHandler();

        var socket = socketHandler.getSocket('/core');
        socket.isConnected = true;

        io.SocketNamespace.prototype.$emit('event', {foo: 'bar'});

        callback();

        expect($.ajax).toHaveBeenCalled();
    });

    it('should update cookie if AJAX calls were made', deps, function (SocketHandler, io) {
        unmockSocketHandler(SocketHandler);
        mockSocketIO(io);

        spyOn(window, 'setInterval');
        spyOn(XMLHttpRequest.prototype, 'open');

        var callback;

        window.setInterval.andCallFake(function (fn) {
            callback = fn;
        });

        var socketHandler = new SocketHandler();

        var socket = socketHandler.getSocket('/core');
        socket.isConnected = true;


        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/example/controller/test', true);

        callback();

        expect($.ajax).toHaveBeenCalled();
    });

    it('should notify when the cookie expires', deps, function (SocketHandler, io, observer) {
        unmockSocketHandler(SocketHandler);
        mockSocketIO(io);

        spyOn(window, 'setInterval');

        var callback;

        window.setInterval.andCallFake(function (fn) {
            callback = fn;
        });

        var socketHandler = new SocketHandler();

        var socket = socketHandler.getSocket('/core');
        socket.isConnected = true;

        callback();

        expect($.ajax).not.toHaveBeenCalled();
        expect(observer.publish).toHaveBeenCalledWith('session_expired');
    });

    function unmockSocketHandler(SocketHandler) {
        SocketHandler.prototype.getSocket.andCallThrough();
        SocketHandler.prototype._getBaseUrl.andCallThrough();
        SocketHandler.prototype._interceptAjaxCalls.andCallThrough();
        SocketHandler.prototype._interceptSocketMessages.andCallThrough();
        SocketHandler.prototype._refreshSessionCookie.andCallThrough();
    }

    function mockSocketIO(io) {
        io.SocketNamespace.prototype.$emit = function () {};
        io.SocketNamespace.prototype.emit = function () {};

        var socket = {
            on: jasmine.createSpy('on'),
            once: jasmine.createSpy('once'),
            emit: jasmine.createSpy('emit'),
            socket: {
                reconnect: jasmine.createSpy('reconnect')
            },
            onHandlers: {},
            onceHandlers: {},
            callHandlers: function (event) {
                if (this.onHandlers[event]) {
                    this.onHandlers[event]();
                }

                if (this.onceHandlers[event]) {
                    this.onceHandlers[event]();
                    delete this.onceHandlers[event];
                }
            }
        };

        socket.on.andCallFake(function (event, handler) {
            socket.onHandlers[event] = handler;
        });

        socket.once.andCallFake(function (event, handler) {
            socket.onceHandlers[event] = handler;
        });

        io.connect.andCallFake(function () {
            return socket;
        });

        return socket;
    }
});

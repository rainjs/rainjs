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

describe('ClientRenderer', function () {
    this.disableMock = true;

    var renderer, registry, defer, socket;

    beforeEach(function () {
        var done = false;

        runs(function () {
            window.rainContext = {
                placeholder: {
                    id: 'placeholder',
                    version: '1.0',
                    html: 'placeholder markup',
                    children: []
                },
                placeholderTimeout: 100
            };

            window.$ = jasmine.createSpy('jQuery');
            $.ajax = jasmine.createSpy('ajax');
            $.andReturn(jasmine.createSpyObj('jQuery', ['get', 'attr', 'css', 'append', 'hasClass',
                'addClass', 'html', 'find', 'remove']));
            $().length = 0;
            $().find.andReturn($());

            require([
                'raintime/client_renderer',
                'raintime/css/renderer',
                'raintime/messaging/sockets',
                'raintime/lib/promise'
            ], function (ClientRenderer, CssRenderer, SocketHandler, Promise) {
                spyOn(CssRenderer, 'get');
                spyOn(SocketHandler, 'get');

                socket = jasmine.createSpyObj('socket', ['on', 'emit']);

                SocketHandler.get.andReturn({
                    getSocket: function () { return socket; }
                });

                CssRenderer.get.andReturn(jasmine.createSpyObj('cssRenderer', ['load']));

                renderer = new ClientRenderer();
                registry = renderer.getComponentRegistry();

                spyOn(registry, 'getParent');
                spyOn(registry, 'register');
                spyOn(registry, 'deregister');
                spyOn(registry, 'load');
                spyOn(registry, 'waitInstanceId');
                spyOn(registry, 'getComponent');

                defer = Promise.defer;

                done = true;
            });
        });

        waitsFor(function () {
            return done;
        });
    });

    afterEach(function () {
        runs(function () {
            delete window.rainContext;
            renderer = null;
            registry = null;
            socket = null;
            window.$ = jQuery;
        });
    });

    describe('renderComponent', function () {
        var componentData, orphanData, indirectOrphanData, childComponent;

        beforeEach(function () {
            runs(function () {
                componentData = {
                    css: [],
                    children: [{
                        instanceId:'id5',
                        staticId: 'cancelButton',
                        placeholder: false
                    }],
                    html:'component markup',
                    controller: '/example/3.0/js/button.js',
                    instanceId: 'id1',
                    staticId: 'cancelButton',
                    id: 'example',
                    version: '3.0'
                };

                childComponent = {
                    css: [],
                    children: [],
                    html:'child markup',
                    controller: '/example/3.0/js/child.js',
                    instanceId: 'id5',
                    staticId: 'cancelButton',
                    id: 'example',
                    version: '3.0'
                };

                orphanData = {
                    css: [],
                    children: [{
                        instanceId:'id3',
                        staticId: 'selector',
                        placeholder: false
                    }],
                    html:'component markup',
                    controller: '/example/3.0/js/button.js',
                    instanceId: 'id2',
                    staticId: 'cancelButton',
                    id: 'example',
                    version: '3.0',
                    containerId: 'id1'
                };

                indirectOrphanData = {
                    css: [],
                    children: [],
                    html:'component markup',
                    controller: '/example/3.0/js/button.js',
                    instanceId: 'id3',
                    staticId: 'cancelButton',
                    id: 'example',
                    version: '3.0'
                };
            });
        });

        it('should set the parentInstanceId', function () {
            registry.getParent.andReturn({instanceId: function () { return 'id0'; }});

            renderer.renderComponent(componentData);

            var component = registry.register.mostRecentCall.args[0];
            expect(component.parentInstanceId()).toEqual('id0');
        });

        it('should register the component', function () {
            renderer.renderComponent(componentData);

            expect(registry.register).toHaveBeenCalled();
            var component = registry.register.mostRecentCall.args[0];
            expect(component.instanceId()).toEqual(componentData.instanceId);
        });

        it('should notify the registry about the children instance ids', function () {
            renderer.renderComponent(componentData);

            var child = componentData.children[0];
            expect(registry.waitInstanceId).toHaveBeenCalledWith(child.instanceId);
        });

        it('should insert the markup in the DOM', function () {
            var deferred = defer();
            registry.load.andReturn(deferred.promise);
            $().length = 1;

            renderer.renderComponent(componentData);

            var component = registry.register.mostRecentCall.args[0];
            expect($().append).toHaveBeenCalledWith(componentData.html);
            expect($().css).toHaveBeenCalledWith('visibility', 'hidden');
            expect($().attr).toHaveBeenCalledWith('id', componentData.instanceId);
            expect($().attr).toHaveBeenCalledWith('class', component.cssClass());
        });

        it('should load the component', function () {
            var deferred = defer();
            registry.load.andReturn(deferred.promise);
            $().length = 1;

            renderer.renderComponent(componentData);

            var component = registry.register.mostRecentCall.args[0];
            expect(registry.load).toHaveBeenCalledWith(component);
        });

        it('should show the component', function () {
            var deferred = defer();
            registry.load.andReturn(deferred.promise);
            $().length = 1;

            renderer.renderComponent(componentData);

            deferred.resolve();

            expect($().css).toHaveBeenCalledWith('visibility', '');
        });

        it('should handle components rendered in a container', function () {
            var deferred = defer();
            registry.load.andReturn(deferred.promise);
            $().length = 0;

            renderer.renderComponent(orphanData);

            registry.getParent.andReturn({
                instanceId: function () { return orphanData.instanceId; }
            });

            renderer.renderComponent(indirectOrphanData);

            expect(registry.load).not.toHaveBeenCalled();

            expect(registry.register.calls.length).toEqual(2);
            var orphan = registry.register.calls[0].args[0];
            var indirectOrphan = registry.register.calls[1].args[0];

            $().length = 1;
            registry.getParent.andReturn(null);

            renderer.renderComponent(componentData);

            var component = registry.register.calls[2].args[0];

            expect(registry.load).toHaveBeenCalledWith(component);
            expect(registry.load).toHaveBeenCalledWith(orphan);
            expect(registry.load).toHaveBeenCalledWith(indirectOrphan);
        });

        it('should show the placeholder', function () {
            jasmine.Clock.useMock();
            componentData.children[0].placeholder = true;

            var deferred = defer();
            registry.load.andReturn(deferred.promise);
            $().length = 1;

            renderer.renderComponent(componentData);

            deferred.resolve();

            jasmine.Clock.tick(rainContext.placeholderTimeout + 1);

            expect($().html).toHaveBeenCalledWith(rainContext.placeholder.html);

            renderer.renderComponent(childComponent);

            expect($().remove.calls.length).toEqual(2);
        });
    });

    describe('requestComponent', function () {
        it('should throw error if the passed options are invalid', function () {
            expect(function () {
                renderer.requestComponent({});
            }).toThrow();
        });

        it('should show the placeholder', function () {
            jasmine.Clock.useMock();
            var deferred = defer();
            registry.getComponent.andReturn(deferred.promise);
            $().length = 1;

            renderer.requestComponent({
                id: 'example',
                view: 'index',
                instanceId: 'id7',
                placeholder: true
            });

            jasmine.Clock.tick(rainContext.placeholderTimeout + 1);

            expect($().html).toHaveBeenCalledWith(rainContext.placeholder.html);
        });

        it('should send a render event on web sockets', function () {
            var deferred = defer(),
                options = {
                    id: 'example',
                    view: 'index',
                    instanceId: 'id7'
                };

            registry.getComponent.andReturn(deferred.promise);

            renderer.requestComponent(options);

            expect(socket.emit).toHaveBeenCalledWith('render', options);
        });

        it('should notify the component registry about the new instance id', function () {
            var deferred = defer();
            registry.getComponent.andReturn(deferred.promise);

            renderer.requestComponent({
                id: 'example',
                view: 'index',
                instanceId: 'id7'
            });

            expect(registry.waitInstanceId).toHaveBeenCalledWith('id7');
        });

        it('should resolve the returned promise when the component is started', function () {

        });
    });

    describe('removeComponent', function () {

    });

    describe('createComponentContainer', function () {

    });
});

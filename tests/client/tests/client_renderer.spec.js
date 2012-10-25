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

describe('Client Renderer', function () {
    var mocks, clientRenderer, success, error;

    beforeEach(function () {
        mocks = {};
    });

    function setup(ClientRenderer) {
        ClientRenderer.get.andCallFake(function () {
            return new ClientRenderer;
        });

        mocks.Sockets = jasmine.loadedModules['raintime/messaging/sockets'];
        mocks.Sockets.getSocket.andReturn({ on: jasmine.createSpy() });

        mocks.Raintime = jasmine.loadedModules['raintime'];
        mocks.Raintime.componentRegistry = jasmine.createSpyObj('componentRegistry',
                                                                ['preRegister']);

        var loadCss = jasmine.createSpyObj('cssRenderer', ['then']);
        loadCss.then.andCallFake(function (resolve, err) {
            success = resolve;
            error = err;
        });

        mocks.CssRenderer = jasmine.loadedModules['raintime/css_renderer'];
        mocks.CssRenderer.get = function () {
            return {
                loadCss: function () {
                    return loadCss;
                }
            };
        };

        clientRenderer = ClientRenderer.get();
    }

    describe('render component', function () {
        var component1, component2, container,
            component3, child1, child2;

        beforeEach(function () {
            component1 = {
                instanceId: 'ff44aa',
                containerId: 'ec038f',
                id: 'component',
                version: '1.0'
            };
            component2 = {
                instanceId: 'ff44bb',
                containerId: 'ec038f',
                id: 'component',
                version: '2.6.89'
            };
            container = {
                instanceId: 'ec038f',
                id: 'container',
                version: '1.5.2'
            };

            child1 = {
                instanceId: 'c1',
                id: 'selector',
                version: '1.0'
            };
            child2 = {
                instanceId: 'c2',
                id: 'selector',
                version: '2.0',
                placeholder: true
            };
            component3 = {
                instanceId: 'cc9922',
                id: 'example',
                version: '2.6.89',
                children: [child1, child2]
            };
        });

        it('should add an orphan component to its container\'s orphans list',
                ['raintime/client_rendering'],
                function (ClientRenderer) {

            setup(ClientRenderer);
            ClientRenderer.prototype.renderComponent.andCallThrough();

            clientRenderer.renderComponent(component1);

            expect(clientRenderer.orphans[component1.containerId].length).toEqual(1);
            expect(clientRenderer.orphans[component1.containerId]).toContain(component1);
        });

        it('should add multiple orphan components to their container\'s orphans list',
                ['raintime/client_rendering'],
                function (ClientRenderer) {

            setup(ClientRenderer);
            ClientRenderer.prototype.renderComponent.andCallThrough();

            clientRenderer.renderComponent(component1);
            clientRenderer.renderComponent(component2);

            expect(clientRenderer.orphans[component1.containerId].length).toEqual(2);
            expect(clientRenderer.orphans[component1.containerId]).toContain(component1);
            expect(clientRenderer.orphans[component1.containerId]).toContain(component2);
        });

        it('should render the orphan components when the container arrives',
                ['raintime/client_rendering'],
                function (ClientRenderer) {

            setup(ClientRenderer);
            ClientRenderer.prototype.renderComponent.andCallThrough();

            this.after(function () {
                $('#' + component1.instanceId
                    + ',#' + component1.instanceId
                    + ',#' + container.instanceId).remove();
            });

            clientRenderer.renderComponent(component1);
            clientRenderer.renderComponent(component2);

            expect(clientRenderer.orphans[container.instanceId].length).toEqual(2);
            expect(clientRenderer.orphans[container.instanceId]).toContain(component1);
            expect(clientRenderer.orphans[container.instanceId]).toContain(component2);

            var html = [
                '<div id="' + component1.instanceId + '"></div>',
                '<div id="' + component2.instanceId + '"></div>',
                '<div id="' + container.instanceId + '"></div>'
            ];
            $('body').append(html.join('\n'));

            clientRenderer.renderComponent(container);

            var f = ClientRenderer.prototype.renderComponent;

            expect(f.argsForCall[3][0]).toEqual(component1);
            expect(f.argsForCall[4][0]).toEqual(component2);

            expect(clientRenderer.orphans[container.instanceId]).not.toBeDefined();
        });

        it('should pre-register a component\'s children',
                ['raintime/client_rendering'],
                function (ClientRenderer) {

            setup(ClientRenderer);
            ClientRenderer.prototype.renderComponent.andCallThrough();

            var html = [
                '<div id="' + component3.instanceId + '"></div>'
            ];
            $('body').append(html.join('\n'));

            clientRenderer.renderComponent(component3);

            expect(mocks.Raintime.componentRegistry.preRegister.callCount).toEqual(2);
            expect(child1.parentInstanceId).toEqual(component3.instanceId);
            expect(child2.parentInstanceId).toEqual(component3.instanceId);
            expect(clientRenderer._placeholderTimeout.callCount).toEqual(1);
            expect(clientRenderer._placeholderTimeout).toHaveBeenCalledWith(child2);
       });

        it('should show the component html when it doesn\'t have any css files',
                ['raintime/client_rendering'],
                function (ClientRenderer) {

            setup(ClientRenderer);
            ClientRenderer.prototype.renderComponent.andCallThrough();

            var html = [
                '<div id="' + component3.instanceId + '"></div>'
            ];
            $('body').append(html.join('\n'));
            var domElement = $('#' + component3.instanceId);

            clientRenderer.renderComponent(component3);

            expect(clientRenderer._showHTML).toHaveBeenCalledWith(component3, domElement);
        });

        it('should load the css file before showing the html content',
                ['raintime/client_rendering'],
                function (ClientRenderer) {

            setup(ClientRenderer);
            ClientRenderer.prototype.renderComponent.andCallThrough();

            component3.css = [
                {
                    'path': 'p1'
                },
                {
                    'path': 'p2'
                }
            ];

            var html = [
                '<div id="' + component3.instanceId + '"></div>'
            ];
            $('body').append(html.join('\n'));

            clientRenderer.renderComponent(component3);

            expect(success).toBeDefined();
            expect(error).toBeDefined();

            expect(clientRenderer._showHTML).not.toHaveBeenCalled();
            success();
            expect(clientRenderer._showHTML).toHaveBeenCalled();
        });
    });
});

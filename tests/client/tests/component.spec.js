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

"use strict"

describe("Component module", function () {
    this.disableMock = true;
    var componentData, controller;
    beforeEach(function () {
        componentData = {
            id: 'fakeId',
            version: 'fakeVersion',
            instanceId: 'fakeInstanceId',
            containerId: 'fakeContainerId',
            parentInstanceId: 'fakeParentInstanceId',
            staticId: 'fakeStaticId',
            html: 'fakeHTML',
            componentId: 'fakeCompId',
            controller: 'path/to/controller',
            css: ['style1.css', 'style2.css'],
            children: []
        };

        controller = jasmine.createSpyObj['controller', ['init', 'start', 'end', 'destroy']];

    });

    describe('#getter_setters', function () {
        it('should have all the getter and setters functional', ['raintime/component'], function(Component) {
            var instance = new Component(componentData);

            expect(instance.id()).toBe(componentData.id);
            expect(instance.children().length).toBe(0);
            expect(instance.containerId()).toBe(componentData.containerId);
            expect(instance.instanceId()).toBe(componentData.instanceId);
            expect(instance.parentInstanceId()).toBe(componentData.parentInstanceId);
            expect(instance.html()).toBe(componentData.html);
            expect(instance.staticId()).toBe(componentData.staticId);
            expect(instance.css().length).toBe(2);
            expect(instance.controllerPath()).toBe(componentData.controller);
            expect(instance.containerId()).toBe(componentData.containerId);
        });
    });

    describe('#state', function () {
        it('should change the state depending on the controllers state', ['raintime/component'], function (Component) {
            var instance = new Component(componentData);

            instance.controller(controller);

            instance.state('start');

            expect(instance.state()).toBe('start');

        });
    });

    describe('#addChild', function () {
        it('should add child to children map', ['raintime/component'], function (Component) {
            var instance = new Component(componentData),
                child = {
                    staticId: 'fakeChildStatic',
                    instanceId: 'fakeChildInstance'
                };


            instance.addChild(child);

            expect(instance.children().length).toBe(1);
            expect(instance.getChildByInstanceId(child.instanceId)).toBe(child);
            expect(instance.getChildByStaticId(child.staticId)).toBe(child);

        });
    });

    describe('#removeChild', function () {
        it('should remove child from childrenMap', ['raintime/component'], function (Component) {
            var instance = new Component(componentData),
                child = {
                    staticId: 'fakeChildStatic',
                    instanceId: 'fakeChildInstance'
                };


            instance.addChild(child);
            instance.removeChild(child.staticId);

            expect(instance.children().length).toBe(0);
            expect(instance.getChildByInstanceId(child.instanceId)).toBe(null);
            expect(instance.getChildByStaticId(child.staticId)).toBe(null);
        });
    });
});

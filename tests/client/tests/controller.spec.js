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

describe('Controller API', function () {

    this.disableMock = true;

    var fakeComponent, componentRegistry, clientRenderer, fakeChild,
        events = {};

    beforeEach(function () {
        fakeComponent = jasmine.createSpyObj('component', ['id', 'on', 'hasState',
            'getChildByStaticId', 'children', 'version', 'staticId', 'instanceId',
            'parentInstanceId']);
        componentRegistry = jasmine.createSpyObj('componentRegistry', ['getComponent']);
        clientRenderer = jasmine.createSpyObj('clientRenderer', ['getComponentRegistry']);
        fakeChild = jasmine.createSpyObj('child', ['on', 'id', 'version', 'staticId', 'controller']);

        fakeComponent.on.andCallFake(function (event, handler) {
            if (event === 'start') {
                events[event] = handler;
            }
        });

        fakeChild.on.andCallFake(function (ev, handler) {
            if (ev === 'start') {
                handler();
            }
        });

        fakeChild.controller.andCallFake(function () {
           return true;
        });


        fakeComponent.instanceId.andCallFake(function () {
            return 'fakeInstanceId';
        });

        fakeComponent.parentInstanceId.andCallFake(function () {
            return 'fakeParent';
        });

        fakeComponent.id.andCallFake(function () {
            return 'fakeId';
        });

        fakeComponent.staticId.andCallFake(function () {
            return 'staticId';
        });

        fakeComponent.getChildByStaticId.andCallFake(function () {
            var child = {
                instanceId: 'fakeId'
            };

            return child;
        });

        componentRegistry.getComponent.andCallFake(function () {
            return fakeChild;
        });

        clientRenderer.getComponentRegistry.andCallFake(function () {
            return componentRegistry;
        });

        window.ClientRenderer = {
                get: function () {
                    return clientRenderer;
                }
        }
    });

    describe('#getChild', function () {
        it('should get a child depending on it`s staticId', ['raintime/controller'], function (Controller) {

            var instance = new Controller(fakeComponent),
                child;

            instance.getChild('fakeChild').then(function (component) {
                child = component;
            }, function (err) {
                console.log(err)
            });

            waitsFor(function () {
                return typeof child !== 'undefined';
            });

            runs(function () {
               expect(child).toBe(true);
            });

        });

        it('should reject with error if no children in component', ['raintime/controller'], function (Controller) {

            fakeComponent.getChildByStaticId.andCallFake(function () {
                return;
            });

            window.RainError = jasmine.createSpy('RainError');

            var instance = new Controller(fakeComponent),
                resolved;

            instance.getChild('fakeChild').then(function() {
                resolved = true;
            }, function () {
                resolved = false;
            });

            waitsFor(function () {
                return typeof resolved !== 'undefined';
            });

            runs(function () {
                expect(resolved).toBe(false);
            });

        });

        it('should reject if the controller of a child has an error state', ['raintime/controller'],
            function (Controller) {

                fakeChild.on.andCallFake(function (ev, handler) {
                    if (ev === 'error') {
                        handler();
                    }
                });

                var instance = new Controller(fakeComponent),
                    resolved;

                instance.getChild('fakeChild').then(function() {
                    resolved = true;
                }, function () {
                    resolved = false;
                });

                waitsFor(function () {
                    return typeof resolved !== 'undefined';
                });

                runs(function () {
                    expect(resolved).toBe(false);
                });

        });
    });

    describe('#getChildren', function () {
        it('should get all the children of a component', ['raintime/controller'], function (Controller) {

            fakeComponent.children.andCallFake(function () {
                return [{staticId: 'child1'}, {staticId: 'child2'}];
            });

            var instance = new Controller(fakeComponent),
                children;

            instance.getChildren().then(function (components) {
                children = components;
            }, function () {
                children = false;
            });

            waitsFor(function () {
                return typeof children !== 'undefined';
            });

            runs(function () {
                expect(children["child1"]).toBe(true);
                expect(children["child2"]).toBe(true);
                expect(Object.keys(children).length).toBe(2);
                expect(children).not.toBe(false);
            });



        });

        it('should get all the specified children of a component', ['raintime/controller'], function (Controller) {
            fakeComponent.children.andCallFake(function () {
                return [{staticId: 'child1'}, {staticId: 'child2'}];
            });

            var instance = new Controller(fakeComponent),
                children;

            instance.getChildren(['child1']).then(function (components) {
                children = components
            }, function () {
                children = false;
            });

            waitsFor(function () {
                return typeof children !== 'undefined';
            });

            runs(function () {
                expect(children["child1"]).toBe(true);
                expect(Object.keys(children).length).toBe(1);
                expect(children).not.toBe(false);
            });
        });
    });


    describe('#onChild', function () {
        it('should listen for an event on a child and execute a handler', ['raintime/controller'],
            function (Controller) {

                var controller = jasmine.createSpyObj('controller', ['on']);
                controller.on.andCallFake(function (ev, cb) {
                    cb();
                });

                fakeChild.controller.andCallFake(function() {
                    return controller;
                });

                var instance = new Controller(fakeComponent),
                    hasExecuted;

                instance.onChild('child1', 'click', function () {
                    hasExecuted = true;
                });

                waitsFor(function () {
                    return typeof hasExecuted !== 'undefined';
                });

                runs(function () {
                    expect(hasExecuted).toBe(true);
                });
        });
    });
});
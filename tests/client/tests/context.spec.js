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

describe('Context module', function () {
    this.disableMock = true;

    var fakeComponent, clientRenderer, componentRegistry;

    beforeEach(function () {
        fakeComponent = jasmine.createSpyObj('component', ['id', 'on', 'hasState',
            'getChildByStaticId', 'children', 'version', 'staticId', 'instanceId',
            'parentInstanceId', 'rootElement', 'controller', 'addChild', 'removeChild']);

        clientRenderer = jasmine.createSpyObj('clientRenderer', ['createComponentContainer', 'requestComponent',
        'getComponentRegistry', 'removeComponent']);

        componentRegistry = jasmine.createSpyObj('componentRegistry', ['deregister', 'getComponent'])

        fakeComponent.instanceId.andCallFake(function () {
           return 'fakeId';
        });

        clientRenderer.createComponentContainer.andCallFake(function () {
           return 'fakeInstanceId';
        });

        fakeComponent.rootElement.andCallFake(function () {
            var element = $('<div></div>');

            return element;
        });

        clientRenderer.getComponentRegistry.andCallFake(function () {
            return componentRegistry;
        });

        window.ClientRenderer = {
            get : function () {
                return clientRenderer;
            }
        }
    });

    describe('#insert', function () {

        it('should insert the component', ['raintime/context', 'raintime/lib/promise'], function (Context, Promise) {

            var instance = new Context(fakeComponent),
                defer = Promise.defer(),
                wasInserted;

            clientRenderer.requestComponent.andCallFake(function () {
                setTimeout(function () {
                    defer.resolve(fakeComponent);
                }, 0);

                return defer.promise;
            });

            instance.insert({
                id: 'test',
                view: 'fake',
                placeholder: true
            }, '<div></div>', function () {
                wasInserted = true;
            });

            waitsFor(function () {
                return typeof wasInserted !== 'undefined';
            });

            runs(function () {
                expect(wasInserted).toBe(true);
                expect(fakeComponent.controller).toHaveBeenCalled();
                expect(fakeComponent.addChild).toHaveBeenCalledWith({
                    staticId: 'fakeInstanceId',
                    instanceId: 'fakeInstanceId',
                    placeholder: true
                })
            });

        });
    });

    describe('#replace', function () {

        it('should replace a component', ['raintime/context', 'raintime/lib/promise'], function (Context, Promise) {
            var instance = new Context(fakeComponent),
                defer = Promise.defer(),
                wasReplaced;

            clientRenderer.requestComponent.andCallFake(function () {
                setTimeout(function () {
                    defer.resolve(fakeComponent);
                }, 0);

                return defer.promise;
            });

            instance.replace('someFakeComponent', function () {
                wasReplaced = true;
            });

            waitsFor(function () {
                return typeof wasReplaced !== 'undefined';
            });

            runs(function () {
                expect(componentRegistry.deregister).toHaveBeenCalledWith('fakeId');
                expect(wasReplaced).toBe(true);
                expect(fakeComponent.controller).toHaveBeenCalled();
            });

        });
    });

    describe('#remove', function () {

        it('should remove a child component if it exists', ['raintime/context'], function (Context) {
            var instance = new Context(fakeComponent);

            fakeComponent.getChildByStaticId.andCallFake(function () {
                return {
                    instanceId: 'fakeId'
                };
            });

            instance.remove('goodChild');

            expect(clientRenderer.removeComponent).toHaveBeenCalledWith('fakeId');
            expect(fakeComponent.removeChild).toHaveBeenCalledWith('goodChild');

        });

        it('should not remove children if staticId is wrong', ['raintime/context'], function (Context) {
            var instance = new Context(fakeComponent);

            fakeComponent.getChildByStaticId.andCallFake(function () {
                return;
            });

            instance.remove('wrongChild');

            expect(clientRenderer.removeComponent).not.toHaveBeenCalled();
            expect(fakeComponent.removeChild).not.toHaveBeenCalled();
        });
    });

    describe('#find', function () {
        it('should not run the function if no callback is passed', ['raintime/context'], function (Context) {
            var instance = new Context(fakeComponent);

            instance.remove('staticId');

            expect(clientRenderer.getComponentRegistry).not.toHaveBeenCalled();
        });

        it('should get all the children if no staticIds are passed', ['raintime/context'], function (Context) {

            fakeComponent.children.andCallFake(function () {
                return [{staticId: 'child1'}, {staticId: 'child2'}];
            });

            fakeComponent.getChildByStaticId.andCallFake(function (staticId) {
                return staticId;
            });

            var retrievedComponent = jasmine.createSpyObj('retrvComponent', ['once']);
            retrievedComponent.controller = 'fake';

            retrievedComponent.once.andCallFake(function (ev, handler) {
                handler();
            });

            componentRegistry.getComponent.andCallFake(function () {
                return retrievedComponent;
            });


            var instance = new Context(fakeComponent),
                hasExecuted,
                fakeCallback = jasmine.createSpy('fakeCB');

            fakeCallback.andCallFake(function () {
                hasExecuted = true;
            })

            instance.find(fakeCallback);

            waitsFor(function () {
                return typeof hasExecuted !== 'undefined';
            });

            runs(function () {
                expect(fakeCallback).toHaveBeenCalledWith('fake', 'fake');
            });
        });

        it('should get the specified components', ['raintime/context'], function (Context) {
            fakeComponent.children.andCallFake(function () {
                return [{staticId: 'child1'}, {staticId: 'child2'}];
            });

            fakeComponent.getChildByStaticId.andCallFake(function (staticId) {
                return staticId;
            });

            var retrievedComponent = jasmine.createSpyObj('retrvComponent', ['once']);
            retrievedComponent.controller = 'fake';

            retrievedComponent.once.andCallFake(function (ev, handler) {
                handler();
            });

            componentRegistry.getComponent.andCallFake(function () {
                return retrievedComponent;
            });


            var instance = new Context(fakeComponent),
                hasExecuted,
                fakeCallback = jasmine.createSpy('fakeCB');

            fakeCallback.andCallFake(function () {
                hasExecuted = true;
            })

            instance.find('child1', fakeCallback);

            waitsFor(function () {
                return typeof hasExecuted !== 'undefined';
            });

            runs(function () {
                expect(fakeCallback).toHaveBeenCalledWith('fake');
            });
        });

        it('should return the wrong staticIds if they were not found', ['raintime/context'], function(Context) {
            fakeComponent.children.andCallFake(function () {
                return [{staticId: 'child1'}, {staticId: 'child2'}];
            });

            fakeComponent.getChildByStaticId.andCallFake(function (staticId) {
                return;
            });

            var retrievedComponent = jasmine.createSpyObj('retrvComponent', ['once']);
            retrievedComponent.controller = 'fake';

            retrievedComponent.once.andCallFake(function (ev, handler) {
                handler();
            });

            componentRegistry.getComponent.andCallFake(function () {
                return retrievedComponent;
            });


            var instance = new Context(fakeComponent),
                hasExecuted,
                fakeCallback = jasmine.createSpy('fakeCB');

            fakeCallback.andCallFake(function () {
                hasExecuted = true;
            });

            var result = instance.find('invalidChild', fakeCallback);

            expect(fakeCallback).not.toHaveBeenCalled();
            expect(result).toEqual(['invalidChild']);
        });
    });

    describe('#getRoot', function () {
        it('should retrieve the dom root element', ['raintime/context'], function (Context) {
            var instance = new Context(fakeComponent);

            instance.getRoot();

            expect(fakeComponent.rootElement).toHaveBeenCalled();
        });
    });

});

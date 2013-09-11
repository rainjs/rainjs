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

describe('Component Registry module', function () {

    this.disableMock = true;

    var controller, cssRenderer, component;

    beforeEach(function () {
        cssRenderer = jasmine.createSpyObj('cssRenderer', ['unload', 'load']);
    });

    describe('#register', function () {
        it('should register a component in the component map', ['raintime/component_registry',
                'raintime/component', 'raintime/controller', 'raintime/css/renderer'], function (ComponentRegistry,
                    Component, Controller, CssRenderer) {

            var instance = new ComponentRegistry(),
                fakeComponent = jasmine.createSpyObj('component', ['instanceId']);

            fakeComponent.instanceId.andCallFake(function () {
                return 'fakeInstanceId'
            });

            instance.register(fakeComponent);

            expect(instance.getComponent('fakeInstanceId')).toBe(fakeComponent);
        });
    });

    describe('#getParent', function () {

        it('should retrieve the parent of a component based on it`s instanceId', ['raintime/component_registry',
            'raintime/component', 'raintime/controller', 'raintime/css/renderer'], function (ComponentRegistry,
                     Component, Controller, CssRenderer) {

            var instance = new ComponentRegistry(),
                fakeComponent = jasmine.createSpyObj('component', ['instanceId', 'getChildByInstanceId']);

            fakeComponent.instanceId.andCallFake(function () {
                return 'fakeInstanceId'
            });

            fakeComponent.getChildByInstanceId.andCallFake(function (id) {
                if(id === 'fakeChildId') {
                    return true;
                } else {
                    return false;
                }
            });

            instance.register(fakeComponent);

            expect(instance.getParent('fakeChildId')).toBe(fakeComponent);

        });
    });


    describe('#deregister', function () {
        it('should deregister a component from the component map', ['raintime/component_registry',
            'raintime/component', 'raintime/controller', 'raintime/css/renderer'], function (ComponentRegistry,
                    Component, Controller, CssRenderer) {

            Controller = controller;

            CssRenderer.get = function () {
                return cssRenderer;
            }

            Component = component;

            var instance = new ComponentRegistry(),
                fakeComponent = jasmine.createSpyObj('component', ['instanceId', 'getChildByInstanceId', 'children',
                'state']);

            fakeComponent.instanceId.andCallFake(function () {
                return 'fakeInstanceId'
            });

            fakeComponent.children.andCallFake(function () {
                return [];
            });

            instance.register(fakeComponent);

            instance.deregister('fakeInstanceId');

            expect(fakeComponent.state).toHaveBeenCalledWith('destroy');
            expect(instance.getComponent('fakeInstanceId')).toBe(null);
        });
    });

    describe('load', function () {
        it('should load css and controller for a component', ['raintime/component_registry',
            'raintime/component', 'raintime/controller', 'raintime/css/renderer', 'raintime/lib/promise'],
            function (ComponentRegistry,
                     Component, Controller, CssRenderer, Promise) {


                var deferred = Promise.defer(),
                    finished;

                window.rainContext = {

                    enableMinification: false
                };

                CssRenderer.get = function () {
                    return cssRenderer;
                };

                cssRenderer.load.andCallFake(function () {
                    setTimeout(function () {
                        deferred.resolve();
                    }, 0);
                    return deferred.promise;
                });

                spyOn(window, 'require');

                window.require.andCallFake(function (deps, cb) {
                    cb();
                });

                var instance = new ComponentRegistry(),
                    fakeComponent = jasmine.createSpyObj('component', ['instanceId', 'getChildByInstanceId', 'children',
                        'state', 'controllerPath', 'id', 'version', 'staticId', 'parentInstanceId', 'on', 'controller',
                    'once']);

                fakeComponent.instanceId.andCallFake(function () {
                    return 'fakeInstanceId'
                });

                fakeComponent.state.andCallFake(function (state) {
                    if(typeof state === 'undefined') {
                        return fakeComponent._state;
                    } else {
                        fakeComponent._state = state;
                    }
                });

                fakeComponent.id.andCallFake(function () {
                    return 'fakeId';
                });

                fakeComponent.controllerPath.andCallFake(function () {
                    return 'fakePath';
                });

                fakeComponent.version.andCallFake(function () {
                    return 'fakeVersion';
                });

                fakeComponent.staticId.andCallFake(function () {
                    return 'fakeStaticId';
                });

                fakeComponent.parentInstanceId.andCallFake(function () {
                    return 'fakeParentId';
                });

                fakeComponent.on.andCallFake(function (ev, cb) {
                    cb();
                });

                fakeComponent.once.andCallFake(function (ev, cb) {
                    cb();
                })


                fakeComponent.children.andCallFake(function () {
                    return [];
                });

                instance.load(fakeComponent).then(function () {
                    finished = true;
                });

                waitsFor(function () {
                   return typeof finished !== 'undefined';
                });

                runs(function () {
                   expect(fakeComponent.state()).toBe('start');
                });
        });
    });
});
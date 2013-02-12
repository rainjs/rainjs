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

define(['raintime/lib/promise',
        'raintime/lib/event_emitter',
        'raintime/context',
        'raintime/async_controller',
        'raintime/logger',
        'raintime/css/renderer',
        'raintime/lib/rain_error'
], function (Promise, EventEmitter, Context, AsyncController, Logger, CssRenderer) {

    var logger = Logger.get();

    var raintime = new Raintime();

    /**
     * The map of registered components, indexed by the instanceId property.
     *
     * @type {Object}
     * @private
     */
    var components = {};

    /**
     * The map of components for which the html content was not retrieved. When the html content
     * arrives for a component, the component is moved to the ``components`` map.
     * The components are indexed by the instanceId property.
     *
     * @type {Object}
     * @private
     */
    var preComponents = {};

    /**
     * The map of callbacks for components that will be inserted or that will replace other
     * components. These callbacks will be called after the controllers for the components are
     * loaded and before invoking the lifecycle for them.
     * The components are indexed by the instanceId property.
     *
     * @type {Object}
     * @private
     */
    var callbacks = {};

    /**
     * The main client-side starting point used to access other libraries used in the controllers.
     *
     * @name Raintime
     * @class This class is used by the ClientRenderer to register components.
     * @constructor
     *
     * @property {ComponentRegistry} componentRegistry the component registry instance
     */
    function Raintime() {
        this.componentRegistry = new ComponentRegistry();
    }

    /**
     * Creates a new component and sets default values.
     *
     * @name Component
     * @class Keeps information about a component.
     * @constructor
     *
     * @property {String} id the component id
     * @property {String} version the component version
     * @property {String} instanceId the instance id
     * @property {String} parentInstanceId the instance id of the direct parent
     * @property {String} staticId the static id
     * @property {Object} error the error object obtained when the server-side data detected an error
     * @property {Object} controller the client-side controller for this component
     * @property {Array} children the list of instance ids of the direct children
     * @property {Boolean='false'} controllerLoaded true if the controller file was loaded
     * @property {Boolean='false'} initEmitted true if the init event was emitted
     * @property {Boolean='false'} htmlLoaded true if the html content for the component was received
     */
    function Component(component) {
        this.id = component.id;
        this.version = component.version;
        this.instanceId = component.instanceId;
        this.parentInstanceId = component.parentInstanceId;

        this.staticId = component.staticId;
        this.error = undefined;
        this.controller = undefined;
        this.children = component.children || [];

        this.state = Component.LOAD;
        this.controllerLoaded = false;
        this.htmlLoaded = component.htmlLoaded || false;
    }

    Component.LOAD = 1;
    Component.INIT = 2;
    Component.ERROR = 4;
    Component.START = 8;
    Component.DESTROY = 16;
    Component.DESTROYED = 32;
    Component.PENDING = 64;

    /**
     * Creates a new component registry.
     *
     * @name ComponentRegistry
     * @class Keeps information about the registered components and offers methods for register them.
     * @constructor
     */
    function ComponentRegistry() {}

    /**
     * Registers a component and invokes the lifecycle.
     *
     * @param {Component} component the component to register
     */
    ComponentRegistry.prototype.register = function (component) {
        if (!component || !component.instanceId) {
            logger.warn('Trying to register an invalid component: ' +
                        (component ? JSON.stringify(component) : ''));
            return;
        }

        var preComponent = preComponents[component.instanceId];
        if (preComponent) {
            if (preComponent.id != component.id) {
                component.htmlLoaded = true;
                registerComponent(components, component);
                return;
            }

            var children = preComponent.children;
            children.push.apply(children, component.children);
            preComponent.error = component.error;
            components[preComponent.instanceId] = preComponent;

            preComponent.htmlLoaded = true;
            invokeLifecycle(preComponent);

            delete preComponents[preComponent.instanceId];
        } else {
            component.htmlLoaded = true;
            registerComponent(components, component);
        }
    };

    /**
     * Makes a partial registration. This is used to load the client-side controller of the
     * component before the html comes from the server-side in order to speed up the process
     * of loading dependencies when the template data takes a longer time to be obtained.
     *
     * @param {Component} component the component to register
     */
    ComponentRegistry.prototype.preRegister = function (component) {
        if (!component || !component.instanceId) {
            return;
        }
        registerComponent(preComponents, component);
    };

    /**
     * Checks if a component is preregistered.
     *
     * @param {Component} component the component to register
     */
    ComponentRegistry.prototype.isPreRegistered = function (component) {
        if (!component || !component.instanceId) {
            return;
        }
        return typeof preComponents[component.instanceId] !== 'undefined';
    };

    /**
     * De-registers a component.
     *
     * @param {String} instanceId the component's instance id
     */
    ComponentRegistry.prototype.deregister = function (instanceId) {
        var component = components[instanceId];
        if (instanceId && component) {
            var children = component.children;
            for (var i = children.length; i--;) {
                this.deregister(children[i].instanceId);
            }
            component.state = Component.DESTROY;
            invokeLifecycle(component);

            if (component.parentInstanceId && component.staticId) {
                var parent = components[component.parentInstanceId];
                if (parent && parent.controller) {
                    parent.controller._clear(component.staticId);
                }
            }

            CssRenderer.get().unload(component);
            delete components[instanceId];
        }
    };

    /**
     * Sets a callback to be called after the controller for the component was loaded and before
     * invoking the lifecycle.
     *
     * @param {String} instanceId the component's instance id
     * @param {Function} callback the callback function
     */
    ComponentRegistry.prototype.setCallback = function (instanceId, callback) {
        if (!instanceId || typeof callback !== 'function') {
            return;
        }
        callbacks[instanceId] = callback;
    };

    /**
     * Finds one or more components by their staticIds in the children of a component with the
     * corresponding instanceId argument.
     * If the staticId is undefined then all the controllers for the children are returned.
     *
     * @param {String} instanceId the component's instance id
     * @param {Array|String} staticIds an array / string of static ids for children
     * @param {Function} callback the function to be called after the controllers for the requested children were initiated
     * @returns {undefined|String[]} the list of wrong static ids or undefined
     *
     * @private
     * @memberOf ComponentRegistry#
     */
    function find(instanceId, staticIds, callback) {
        if (!instanceId) {
            logger.error('ComponentRegistry internal error: instanceId must be defined.');
            return;
        }

        var component = components[instanceId];
        if (!component || !component.children) {
            logger.error('The component has no registered children: ' +
                         (component && JSON.stringify(staticIds)));
            return;
        }

        var children = component.children;

        var promises = [];

        if (!staticIds) {
            for (var i = 0, len = children.length; i < len; i++) {
                var childInstanceId = children[i].instanceId;
                if (components[childInstanceId]) {
                    promises.push(components[childInstanceId].promise);
                } else if (preComponents[childInstanceId]) {
                    promises.push(preComponents[childInstanceId].promise);
                }
            }
        } else {
            var wrongStaticIds = [];
            for (var j = 0, len = staticIds.length; j < len; j++) {
                var staticId = staticIds[j],
                    found = false;

                for (var i = children.length; i--;) {
                    var childInstanceId = children[i].instanceId;
                    if (components[childInstanceId] &&
                        components[childInstanceId].staticId == staticId) {
                        promises.push(components[childInstanceId].promise);
                        found = true;
                        break;
                    } else if (preComponents[childInstanceId] &&
                        preComponents[childInstanceId].staticId == staticId) {
                        promises.push(preComponents[childInstanceId].promise);
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    wrongStaticIds.push(staticIds);
                }
            }

            if (wrongStaticIds.length > 0) {
                return wrongStaticIds;
            }
        }

        if (promises.length > 0) {
            var group = Promise.all(promises);
            group.then(function (array) {
                if (array.length == 1) {
                    callback.apply(array[0], array);
                    return;
                }
                callback.apply(component.controller, array);
            });
        } else {
            logger.warn('Components with the following static IDs were not found: ' +
                        JSON.stringify(staticIds));
        }
    }

    /**
     * Registers a new component and requires the client-side controller.
     *
     * @param {Object} map the components map where the new component will be put
     * @param {Object} component the component properties
     *
     * @private
     * @memberOf ComponentRegistry#
     */
    function registerComponent(map, component) {
        var deferred = new Promise.Deferred();
        if (!component.staticId) {
            component.staticId = component.instanceId;
        }
        var newComponent = new Component(component);
        map[newComponent.instanceId] = newComponent;

        newComponent.promise = deferred.promise;

        if (!component.controller) {
            setTimeout(function () {
                deferred.resolve();
            }, 0);
            delete callbacks[newComponent.instanceId];
            return;
        }

        require([component.controller], function (Controller) {
            // Extend the controller with EventEmitter methods.
            for (var key in EventEmitter.prototype) {
                Controller.prototype[key] = EventEmitter.prototype[key];
            }

            // Extend the controller with AsyncController methods.
            for (var key in AsyncController.prototype) {
                Controller.prototype[key] = AsyncController.prototype[key];
            }

            /**
             * The client-side controller.
             *
             * @name controller
             */
            var controller = Controller;
            if (typeof Controller === 'function') {
                controller = new Controller();
                AsyncController.call(controller);
            }

            controller.on = function (eventName, callback) {
                logger.info('Called ' + eventName + ' event for controller ' +
                            component.controller);
                if (eventName === 'start' && newComponent.state === Component.START) {
                    callback.call(controller);
                    return;
                }
                Controller.prototype.on.apply(controller, arguments);
            };

            // Attach modules to the controller.
            /**
             * The context of the controller. It is populated with useful functionality.
             */
            controller.context = new Context(raintime, newComponent);
            controller.context.component = {
                id: newComponent.id,
                version: newComponent.version,
                sid: newComponent.staticId,
                children: newComponent.children
            };

            controller.context._getParent = function () {
                var parentInstanceId = this.parentInstanceId,
                    parent = components[parentInstanceId] || preComponents[parentInstanceId];

                // return a promise if the controller isn't loaded yet
                return parent && (parent.controller || parent.promise);
            };

            controller.context.find = function (staticIds, callback) {
                if (typeof staticIds === 'function') {
                    callback = staticIds;
                    staticIds = undefined;
                } else if (typeof staticIds === 'string') {
                    staticIds = [staticIds];
                }
                if (typeof callback !== 'function') {
                    logger.error('Invalid parameters for context\'s find method',
                                    new Error('The callback parameter must be a function.'));
                    return;
                }
                return find(newComponent.instanceId, staticIds, callback);
            };

            newComponent.controller = controller;

            if (callbacks[newComponent.instanceId]) {
                callbacks[newComponent.instanceId].call(controller, newComponent);
                delete callbacks[newComponent.instanceId];
            }

            newComponent.controllerLoaded = true;
            invokeLifecycle(newComponent);

            deferred.resolve(controller);
        });
    }

    /**
     * Invokes the component's lifecycle in the following order: init, error, start.
     *
     * @param {Object} component the component properties
     *
     * @private
     * @memberOf ComponentRegistry#
     */
    function invokeLifecycle(component) {
        if (component.state === Component.PENDING) {
            return;
        }

        if (component.controllerLoaded && component.state < Component.INIT) {
            emitControllerEvent(component, 'init', undefined, Component.INIT);
            return;
        }

        if (component.htmlLoaded && component.state === Component.INIT) {
            if (component.error) {
                emitControllerEvent(component, 'error', component.error, Component.ERROR);
                return;
            }
            emitControllerEvent(component, 'start', undefined, Component.START);
            return;
        }

        if (component.state === Component.DESTROY) {
            emitControllerEvent(component, 'destroy', undefined, Component.DESTROYED);
        }
    }

    /**
     * Emits an event from the controller.
     *
     * @param {Object} component the component properties
     * @param {String} eventName the event name
     * @param {Object} data the emitted data
     * @param {Number} nextState the next state for the component
     *
     * @private
     * @memberOf ComponentRegistry#
     */
    function emitControllerEvent(component, eventName, data, nextState) {
        var controller = component.controller;

        if (!controller) {
            return;
        }

        var isPromise = false;

        if (typeof controller[eventName] === 'function') {
            var result = controller[eventName](data);

            if (result && result.then && typeof result.then === 'function') {
                isPromise = true;
                component.state = Component.PENDING;
                result.then(function () {
                    component.state = nextState;
                    controller.emit(eventName, data);
                    invokeLifecycle(component);
                }, function () {});
            }
        }

        if (!isPromise) {
            controller.emit(eventName, data);
            component.state = nextState;
            invokeLifecycle(component);
        }
    }

    return raintime;
});

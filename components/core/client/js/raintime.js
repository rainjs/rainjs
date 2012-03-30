define(['raintime/lib/promise',
        'raintime/lib/event_emitter',
        'raintime/context',
        'raintime/lib/rain_error'
], function (Promise, EventEmitter, Context) {

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

        this.staticId = component.staticId;
        this.error = undefined;
        this.controller = undefined;
        this.children = component.children;

        this.state = Component.LOAD;
        this.controllerLoaded = false;
        this.htmlLoaded = component.htmlLoaded || false;
    }

    Component.LOAD = 1;
    Component.INIT = 2;
    Component.ERROR = 4;
    Component.START = 8;
    Component.DESTROY = 16;

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
            return;
        }

        var preComponent = preComponents[component.instanceId];
        if (preComponent) {
            if (preComponent.id != component.id) {
                component.htmlLoaded = true;
                registerComponent(components, component);
                return;
            }

            preComponent.children = component.children;
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
     * De-registers a component.
     *
     * @param {String} instanceId the component's instance id
     */
    ComponentRegistry.prototype.deregister = function (instanceId) {
        if (instanceId && components[instanceId]) {
            var children = components[instanceId].children;
            for(var i = children.length; i--;){
                this.deregister(children[i].instanceId);
            }
            components[instanceId].state = Component.DESTROY;
            invokeLifecycle(components[instanceId]);
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
     * @private
     * @memberOf ComponentRegistry#
     */
    function find(instanceId, staticIds, callback) {
        if (!instanceId) {
            throw new Error('ComponentRegistry internal error: instanceId must be defined.');
        }

        var component = components[instanceId];
        if (!component || !component.children) {
            throw new Error('The component has no registered children.');
        }

        var children = component.children;

        var promises = [];

        if (!staticIds) {
            for (var i = 0, len = children.length; i < len; i++) {
                var childInstanceId = children[i].instanceId;
                if (components[childInstanceId]) {
                    promises.push(components[childInstanceId].promise);
                }
            }
        } else {
            for (var j = 0, len = staticIds.length; j < len; j++) {
                var staticId = staticIds[j];
                for (var i = children.length; i--;) {
                    var childInstanceId = children[i].instanceId;
                    if (components[childInstanceId] &&
                        components[childInstanceId].staticId == staticId) {
                        promises.push(components[childInstanceId].promise);
                        break;
                    } else if (preComponents[childInstanceId] &&
                        preComponents[childInstanceId].staticId == staticId) {
                        promises.push(preComponents[childInstanceId].promise);
                        break;
                    }
                }
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
        }
    }

    /**
     * Registers a new component and requires the client-side controller.
     *
     * @param {Object} map the components map where the new component will be put
     * @param {Object} component the component properties
     * @private
     * @memberOf ComponentRegistry#
     */
    function registerComponent(map, component) {
        var deferred = new Promise.Deferred();

        var newComponent = new Component(component);
        map[newComponent.instanceId] = newComponent;

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

            /**
             * The client-side controller.
             *
             * @name controller
             */
            var controller = Controller;
            if (typeof Controller === 'function') {
                controller = new Controller();
            }

            controller.on = function (eventName, callback) {
                if (eventName === 'start' && newComponent.state === Component.START) {
                    callback.call(controller);
                    return;
                }
                Controller.prototype.on.apply(controller, arguments);
            };

            // Bind lifecycle events to methods found in the controller.
            onControllerEvent(controller, 'init');
            onControllerEvent(controller, 'error');
            onControllerEvent(controller, 'start');
            onControllerEvent(controller, 'destroy');

            // Attach modules to the controller.
            /**
             * The context of the controller. It is populated with useful functionality.
             */
            controller.context = new Context(raintime, newComponent);
            controller.context.find = function (staticIds, callback) {
                if (typeof staticIds === 'function') {
                    callback = staticIds;
                    staticIds = undefined;
                } else if (typeof staticIds === 'string') {
                    staticIds = [staticIds];
                }
                if (typeof callback !== 'function') {
                    throw new Error('The callback parameter must be a function.');
                }
                return find(newComponent.instanceId, staticIds, callback);
            };

            newComponent.controller = controller;

            if (callbacks[newComponent.instanceId]) {
                callbacks[newComponent.instanceId].apply(controller);
                delete callbacks[newComponent.instanceId];
            }

            newComponent.controllerLoaded = true;
            invokeLifecycle(newComponent);

            deferred.resolve(controller);
        });

        newComponent.promise = deferred.promise;
    }

    /**
     * Invokes the component's lifecycle in the following order: init, error, start.
     *
     * @param {Object} component the component properties
     * @private
     * @memberOf ComponentRegistry#
     */
    function invokeLifecycle(component) {
        if (component.controllerLoaded && component.state < Component.INIT) {
            emitControllerEvent(component.controller, 'init');
            component.state = Component.INIT;
        }
        if (component.htmlLoaded && component.state === Component.INIT) {
            if (component.error) {
                emitControllerEvent(component.controller, 'error', component.error);
                component.state = Component.ERROR;
            }
            emitControllerEvent(component.controller, 'start');
            component.state = Component.START;
        }
        if(component.state === Component.DESTROY){
            emitControllerEvent(component.controller, 'destroy');
        }
    }

    /**
     * Emits an event from the controller.
     *
     * @param {Object} controller the component client-side controller
     * @param {String} eventName the event name
     * @param {Object} data the emitted data
     * @private
     * @memberOf ComponentRegistry#
     */
    function emitControllerEvent(controller, eventName, data) {
        if (!controller) {
            return;
        }

        if (typeof controller[eventName] == 'function') {
            controller.emit(eventName, data);
        }
    }

    /**
     * Listens for an event.
     *
     * @param {Object} controller the component client-side controller
     * @param {String} eventName the event name
     * @private
     * @memberOf ComponentRegistry#
     */
    function onControllerEvent(controller, eventName) {
        if (!controller) {
            return;
        }

        if (typeof controller[eventName] == 'function') {
            controller.on(eventName, controller[eventName]);
        }
    }

    return raintime;
});

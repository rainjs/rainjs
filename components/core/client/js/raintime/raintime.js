define(['core/js/event_emitter',
        'core/js/raintime/view_context'
], function (EventEmitter, ViewContext) {

    /**
     * The Raintime instance.
     *
     * @type {Object}
     * @property {ComponentRegistry} componentRegistry the component registry instance
     * @private
     */
    var raintime = new Raintime();
    raintime.componentRegistry = new ComponentRegistry();

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
     * The main client-side starting point used to access other libraries used in the controllers.
     *
     * @name Raintime
     * @class This class is used by the ClientRenderer to register components.
     * @constructor
     */
    function Raintime() {}

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

        this.controllerLoaded = false;
        this.initEmitted = false;
        this.htmlLoaded = component.htmlLoaded || false;
    }

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
        return registerComponent(preComponents, component);
    };

    /**
     * De-registers a component.
     *
     * @param {String} instanceId the component's instance id
     */
    ComponentRegistry.prototype.deregister = function (instanceId) {
        if (instanceId) {
            delete components[instanceId];
        }
    };

    /**
     * Finds a component by its staticId in the children of a component with the
     * corresponding instanceId argument.
     * If the staticId is undefined then all the controllers for the children are returned.
     *
     * @param {String} instanceId the component's instance id
     * @param {String} staticId the child's static id
     * @returns {Controller|Array|undefined} a controller or a list of controllers
     * @private
     * @memberOf ComponentRegistry#
     */
    function find(instanceId, staticId) {
        if (!instanceId) {
            throw new Error('ComponentRegistry internal error: instanceId must be defined.');
        }
        var component = components[instanceId];
        if (component && component.children) {
            var children = component.children;
            if (staticId) {
                for (var i = children.length; i--;) {
                    if (components[children[i]] &&
                        components[children[i]].staticId == staticId) {
                        return components[children[i]].controller;
                    }
                }
            } else {
                var controllers = [];
                for (var i = children.length; i--;) {
                    if (components[children[i]] && components[children[i]].controller) {
                        controllers.push(components[children[i]].controller);
                    }
                }
                return controllers;
            }
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
        var newComponent = new Component(component);
        map[newComponent.instanceId] = newComponent;

        if (!component.controller) {
            return;
        }

        require([component.controller], function (controller) {
            // Extend the controller with EventEmitter methods.
            for (var key in EventEmitter.prototype) {
                controller.prototype[key] = EventEmitter.prototype[key];
            }

            if (typeof controller === 'function') {
                controller = new controller();
            }

            // Bind lifecycle events to methods found in the controller.
            onControllerEvent(controller, 'init');
            onControllerEvent(controller, 'error');
            onControllerEvent(controller, 'start');

            // Attach modules to the controller.
            controller.context = new ViewContext(newComponent);
            controller.context.find = function (staticId) {
                return find(newComponent.instanceId, staticId);
            };

            newComponent.controller = controller;

            newComponent.controllerLoaded = true;
            invokeLifecycle(newComponent);
        });
    }

    /**
     * Invokes the component's lifecycle in the following order: init, error, start.
     *
     * @param {Object} component the component properties
     * @private
     * @memberOf ComponentRegistry#
     */
    function invokeLifecycle(component) {
        if (component.controllerLoaded && !component.initEmitted) {
            emitControllerEvent(component.controller, 'init');
            component.initEmitted = true;
        }
        if (component.htmlLoaded && component.initEmitted) {
            if (component.error) {
                emitControllerEvent(component.controller, 'error', component.error);
            }
            emitControllerEvent(component.controller, 'start');
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

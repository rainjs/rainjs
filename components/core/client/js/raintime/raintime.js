define(['core/js/client_util',
        'core/js/event_emitter',
        'core/js/raintime/view_context'
], function (ClientUtil, EventEmitter, ViewContext) {

    var raintime = (function () {

        var ComponentRegistry = (function () {
            var _instance;

            function getInstance() {

                var components = {};
                var preComponents = {};

                function Component(comp) {
                    this.id = comp.id;
                    this.version = comp.version;
                    this.instanceId = comp.instanceId;

                    this.staticId = comp.staticId;
                    this.controller = null;
                    this.children = comp.children;
                }

                function internalRegister(map, comp) {
                    var component = new Component(comp);
                    map[component.instanceId] = component;

                    if (!comp.controller) {
                        return;
                    }
                    require([comp.controller], function (controller) {
                        for (var key in EventEmitter.prototype) {
                            controller.prototype.__proto__[key] = EventEmitter.prototype[key];
                        }

                        if (typeof controller === 'function') {
                            controller = new controller();
                        }

                        if (typeof controller.init == 'function') {
                            controller.on('init', controller.init);
                        }

                        if (typeof controller.start == 'function') {
                            controller.on('start', controller.start);
                        }

                        controller.viewContext = new ViewContext(component);
                        controller.viewContext.find = function (staticId) {
                            return find(component.instanceId, staticId);
                        };
                        component.controller = controller;

                        controller.emit('init');
                    });
                }

                function register(comp) {
                    if (!comp || !comp.instanceId) {
                        return;
                    }

                    var component = preComponents[comp.instanceId];
                    if (component) {
                        if (component.id != comp.id) {
                            internalRegister(components, comp);
                            return;
                        }

                        component.children = comp.children;
                        components[comp.instanceId] = component;
                        if (component.controller) {
                            component.controller.emit('start');
                        }

                        delete preComponents[comp.instanceId];
                    } else {
                        return internalRegister(components, comp);
                    }
                }

                function preRegister(comp) {
                    if (!comp || !comp.instanceId) {
                        return;
                    }
                    return internalRegister(preComponents, comp);
                }

                function deregister(instanceId) {
                    delete components[instanceId];
                }

                function find(instanceId, staticId) {
                    var component = components[instanceId];
                    if (component && component.children) {
                        var children = component.children;
                        for (var i = children.length; i--;) {
                            if (components[children[i]] &&
                                components[children[i]].staticId == staticId) {
                                return components[children[i]];
                            }
                        }
                    }
                }

                return {
                    preRegister: preRegister,
                    register: register,
                    deregister: deregister
                };
            }

            return {
                get: function () {
                    return _instance || (_instance = getInstance());
                }
            };
        })();

        return {
            ComponentRegistry: ComponentRegistry.get()
        };
    })();

    return raintime;
});

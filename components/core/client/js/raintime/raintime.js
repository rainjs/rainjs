define(['core/js/promised-io/promise',
        'core/js/client_util',
        'core/js/event_emitter'
], function (Promise, ClientUtil, EventEmitter) {

    var raintime = (function () {

        var ComponentRegistry = (function () {
            var _instance;

            function getInstance() {

                var components = {};
                var preComponents = {};

                function Component(comp) {
                    this.id = comp.componentId;
                    this.version = comp.version;
                    this.instanceId = comp.instanceId;

                    this.staticId = comp.staticId;
                    this.controller = null;
                    this.children = comp.children;
                }

                function internalRegister(map, comp) {
                    var deferred = new Promise.Deferred();

                    var component = new Component(comp);
                    map[component.instanceId] = component;

                    if (!comp.controller) {
                        ClientUtil.defer(function () {
                            deferred.resolve(component);
                        });
                    } else {
                        require([comp.controller], function (controller) {
                            ClientUtil.inherits(controller, EventEmitter);

                            if (typeof controller === "function") {
                                controller = new controller();
                            }

                            controller.clientRuntime = raintime;
                            controller.clientRuntime.getComponent = function (staticId) {
                                return getComponent(component.instanceId, staticId);
                            };
                            component.controller = controller;

                            controller.emit('init');

                            deferred.resolve(component);
                        });
                    }

                    return deferred.promise;
                }

                function register(comp) {
                    if (!comp || !comp.instanceId) {
                        return;
                    }

                    var component = preComponents[comp.instanceId];
                    if (component) {
                        delete preComponents[comp.instanceId];
                        comp = component;
                    }

                    return internalRegister(components, comp);
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

                function getComponent(instanceId, staticId) {
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

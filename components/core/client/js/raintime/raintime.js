define(['core/js/promised-io/promise',
        'core/js/client_util',
        'core/js/socket.io/socket.io'
], function (Promise, ClientUtil, SocketIO) {

    var Raintime = (function () {

        var ComponentRegistry = (function () {
            var _instance;

            function getInstance() {

                var components = {};

                function Component(comp) {
                    this.id = comp.componentId;
                    this.version = comp.version;
                    this.instanceId = comp.instanceId;

                    this.staticId = comp.staticId;
                    this.controller = null;
                    this.children = comp.children;
                }

                function register(comp) {
                    var deferred = new Promise.Deferred();

                    var component = new Component(comp);
                    components[component.instanceId] = component;

                    require([comp.controller], function (controller) {
                        ClientUtil.inherits(controller, SocketIO.EventEmitter);

                        if (typeof controller === "function") {
                            controller = new controller();
                        }

                        controller.clientRuntime = Raintime;
                        controller.clientRuntime.getComponent = function (staticId) {
                            return getComponent(component.instanceId, staticId);
                        };
                        component.controller = controller;

                        controller.emit('start');

                        deferred.resolve(component);
                    });

                    return deferred.promise;
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

    return Raintime;
});

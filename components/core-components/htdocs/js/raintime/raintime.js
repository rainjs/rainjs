define(['core-components/client_util',
        'core-components/raintime/raintime_config', 
        'core-components/raintime/viewcontext',
        "core-components/raintime/messaging"], function (ClientUtil, RaintimeConfig) {

    var modules = Array.prototype.splice.call(arguments, 1);
    
    if(window.MozWebSocket) {
        window.WebSocket = window.MozWebSocket;
    }
    
    /**
     * @namespace
     */
    var Raintime = (function () {

        /**
         * Component class
         *
         * @param ids
         * @name Component
         * @constructor
         */
        function Component(ids) {
            this.id = ids.domId;
            this.instanceId = ids.instanceId;
            this.staticId = ids.staticId;
            this.moduleId = ids.moduleId;
            this.controller = null;
            this.state = Raintime.ComponentStates.LOAD;
            this.parent = null;
            this.children = [];

            $(this).trigger('changeState');
        }

        /**
         * Sets the components parent.
         *
         * @param o
         */
        Component.prototype.addParent = function (o) {
            this.parent = o;
        }

        /**
         * Adds a child to the component.
         *
         * @param o
         */
        Component.prototype.addChild = function (o) {
            this.children.push(o);
        }

        /**
         * @param state
         * @param callback
         */
        Component.prototype.bindState = function(state, callback){
            if((state <= Raintime.ComponentStates.START && state <= this.state)
               ||
               (state >= Raintime.ComponentStates.PAUSE && state == this.state)){
                
                callback.call(this);
            } else {
                $(this).one("changeState"+state, { state : state, callback : callback }, function(ev){
                    var state = ev.data.state,
                        callback = ev.data.callback;
                    if(state == this.state){
                        callback.call(this);
                    }
                });
            }
        }

        var _id = 0;

        /**
         * Creates a new component
         *
         * @param ids
         * @returns Component
         */
        function createComponent (ids) {
            return new Component(ids);
        }

        var ComponentController = (function () {
            var _instance;

            function init () {
                function preRender(id) {
                    console.log("preRender " + id);
                }

                function postRender(id) {
                    console.log("postRender " + id);
                    var component = Raintime.ComponentRegistry.components[id];
                    if(Raintime.ComponentStates.LOAD == component.state){
                        component.bindState(Raintime.ComponentStates.INIT, function(){
                            var controller = this.controller;
                            if (controller.start) {
                                controller.start();
                            }
                            
                            this.state = Raintime.ComponentStates.START;
                            $(this).trigger('changeState'+Raintime.ComponentStates.START);
                        });
                    } else {
                        var controller = component.controller;
                        if (controller.start) {
                            controller.start();
                        }
                        
                        component.state = Raintime.ComponentStates.START;
                        $(component).trigger('changeState'+Raintime.ComponentStates.START);
                    }
                }

                function init(id) {
                    console.log("init component " + id);
                }

                /** @lends ComponentController */
                return {
                    preRender:preRender,
                    postRender:postRender,
                    init:init
                };
            }

            /** @lends ComponentController */
            return {
                get: function() {
                    return _instance || (_instance = init());
                }
            };
        })();
        
        /**
         * @name ComponentStates
         * @class Is static and represents the states as name  
         * 
         * @memberOf Raintime
         */
        var ComponentStates = {
            LOAD    : 1,
            INIT    : 2,
            START   : 4,
            PAUSE   : 8,
            STOP    : 16,
            DISPOSE : 32
        };

        /**
         * @name ComponentRegistry
         * @class Represents a version of the component
         *
         * @memberOf Raintime
         */
        var ComponentRegistry = (function () {
            var _instance;

            function init () {
                /**
                 * An array of the registered components
                 *
                 * @type {Component[]}
                 *
                 * @name components
                 * @public
                 * @memberOf Raintime.ComponentRegistry#
                 */
                var components = {};

                /**
                 * Registers a component to the registry
                 *
                 * @param {Object} props Properties of the component: renderer_id, domId, instanceId, domselector, clientcontroller
                 * @returns {Component}
                 * @public
                 * @memberOf Raintime.ComponentRegistry#
                 */
                function register(props) {
                    var id = props.domId,
                        moduleId = props.moduleId,
                        domselector = props.domselector,
                        controllerpath = props.clientcontroller,
                        instanceId = props.instanceId,
                        staticId = props.staticId;

                    console.log("register component " + id);

                    /*if (components[id]) {
                        return;
                    }*/

                    var component = components[id] = createComponent({
                          domId      : id,
                          instanceId : instanceId,
                          staticId   : staticId,
                          moduleId   : moduleId
                    });
                    
                    require([controllerpath], function (controller) {
                        if (typeof controller === "function") {
                            controller = new controller;
                        }
                        component.controller = controller;
                        component.controller.viewContext = Raintime.addViewContext(component);
                        component.controller.viewContext.getSession = ClientUtil.getSession;
                        component.controller.clientRuntime = Raintime;

                        console.log("registered component " + id);

                        if (controller.init) {
                            controller.init();
                        }

                        component.state = Raintime.ComponentStates.INIT;
                        $(component).trigger('changeState'+Raintime.ComponentStates.INIT);
                    });

                    return component;
                }

                /**
                 * Deregisters a component from the registry
                 *
                 * @param {Mixed} id the id of the component to remove
                 * @public
                 * @memberOf Raintime.ComponentRegistry#
                 */
                function deregister (id) {
                    delete components[id];
                }

                /**
                 * Looks up and returns a component by it's static id.
                 *
                 * @public
                 * @memberOf Raintime.ComponentRegistry#
                 * @param staticId
                 * @returns {Component|undefined}
                 */
                function getComponent(staticId) {
                    for (var key in components) {
                        if (components[key].staticId === staticId) {
                            return components[key];
                        }
                    }
                }

                return {
                    components: components,
                    register: register,
                    deregister: deregister,
                    getComponent: getComponent
                };
            }

            return {
                /**
                 * Get an instance of the ComponentRegistry
                 *
                 * @return {ComponentRegistry}
                 *
                 * @name get
                 * @function
                 * @static
                 * @memberOf Raintime.ComponentRegistry
                 */
                get: function () {
                    return _instance || (_instance = init());
                }
            };
        })();

        /** @lends Raintime */
        return {
            createComponent:        createComponent,
            ComponentRegistry:      ComponentRegistry.get(),
            ComponentController:    ComponentController.get(),
            ComponentStates :       ComponentStates
        };
    })();

    for (var m in modules) {
        var module = modules[m];

        ClientUtil.inject(Raintime, module);
    }

    return Raintime;
});

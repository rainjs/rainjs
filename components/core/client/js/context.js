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

define(['raintime/client_storage',
        'raintime/messaging/observer',
        'raintime/messaging/intents',
        'raintime/messaging/sockets',
        'raintime/lib/promise'
], function (ClientStorage, Observer, Intents, SocketHandler, Promise) {

    var all = Promise.all,
        when = Promise.when,
        defer = Promise.defer;

    /**
     * The context reflects a component's client-side state. It gives access to other
     * important libraries like client storage, messaging and web sockets.
     *
     * @name Context
     * @class
     * @constructor
     *
     * @param {Component} component the component object
     *
     * @property {String} instanceId the component's instance id
     * @property {ClientStorage} storage the local storage manager
     */
    function Context(component) {
        var self = this;

        this._component = component;

        this.component = {
            id: component.id(),
            version: component.version(),
            sid: component.staticId(),
            children: component.children()
        };

        this.instanceId = component.instanceId();
        this.parentInstanceId = component.parentInstanceId();
        this.storage = new ClientStorage(this);

        /**
         * Provides methods to publish and subscribe to events.
         *
         * @name messaging
         * @memberOf Context
         */
        this.messaging = {

            /**
             * This is the method that allows registration of a callback method to a
             * desired event.
             *
             * @param {String} eventName Event name we want to subscribe to. Can be any string value.
             * @param {Function} callback This is the callback method that will get executed. It must have a single parameter called data. e.g.: function(data)
             * @param {String} [contextID] a unique id assigned to the context subscribing to the event
             * @memberOf Context.messaging
             */
            subscribe: function (eventName, callback, contextID) {
                Observer.subscribe(eventName, callback, self, contextID);
            },

            /**
             * Unsubscribe from an event.
             *
             * @param {String} eventName Event name we want to subscribe to. Can be any string value.
             * @param {Function} callback This is the callback method that will get executed. It must have a single parameter called data. e.g.: function(data)
             * @memberOf Context.messaging
             */
            unsubscribe: function (eventName, callback) {
                Observer.unsubscribe(eventName, callback, self);
            },

            /**
             * This is the method that will publish an event and will execute all registered callbacks.
             *
             * @param {String} eventName
             * @param {Object} data
             * @memberOf Context.messaging
             */
            publish: function (eventName, data) {
                Observer.publish(eventName, data, self);
            },

            sendIntent: Intents.send,

            getSocket: function (channel) {
                if (channel.charAt(0) != '/') {
                    channel = '/' + component.id() + '/' + component.version() + '/' + channel;
                }

                return SocketHandler.get().getSocket(channel);
            }
        };
    }

    /**
     * Returns the DOM container element for the component associated with this
     * view context.
     *
     * @returns {jQueryElement} The component's container jQuery element
     */
    Context.prototype.getRoot = function () {
       return this._component.rootElement();
    };

    /**
     * Insert a new component into the given DOM Element and set a function that will be called
     * after the controller for the new controller was loaded.
     *
     * The context for the callback function will be the component's controller.
     *
     * @param {Object} componentOptions The component which to be requested
     * @param {String} componentOptions.id The component id
     * @param {String} componentOptions.version the component version
     * @param {String} componentOptions.view The component view id
     * @param {String} componentOptions.sid The component static id
     * @param {Object} componentOptions.context Custom data for the template
     * @param {Boolean} componentOptions.placeholder Enable / Disable placeholder
     * @param {jQuery} element The dom object where the component is inserted
     * @param {Function} [callback] the function to be called after the controller was loaded
     */
    Context.prototype.insert = function (componentOptions, element, callback) {
        var clientRenderer = ClientRenderer.get();

        componentOptions.instanceId = clientRenderer.createComponentContainer(element);

        this._component.addChild({
            staticId: componentOptions.sid || componentOptions.instanceId,
            instanceId: componentOptions.instanceId,
            placeholder: componentOptions.placeholder
        });

        this.component.children = this._component.children();

        clientRenderer.requestComponent(componentOptions).then(function (component) {
            callback && callback.call(component.controller(), component.controller());
        });
    };

    /**
     * Replaces the component from where it is called with the given component and set a
     * function that will be called after the controller for the new component was loaded.
     *
     * The context for the callback function will be the component's controller.
     *
     * @deprecated
     *
     */
    Context.prototype.replace = function (componentOptions, callback) {
        var clientRenderer = ClientRenderer.get();

        componentOptions.instanceId = this.instanceId;

        ClientRenderer.get().getComponentRegistry().deregister(this.instanceId);
        this._component.rootElement().empty();

        clientRenderer.requestComponent(componentOptions).then(function (component) {
            callback && callback.call(component.controller(), component.controller());
        });
    };

    /**
     * Removes a child component.
     *
     * @param {String} staticId the child static id
     */
    Context.prototype.remove = function (staticId) {
        var child = this._component.getChildByStaticId(staticId);

        if (child) {
            ClientRenderer.get().removeComponent(child.instanceId);
            this._component.removeChild(staticId);
            this.component.children = this._component.children();
        }
    };

    /**
     *
     * @param staticIds
     * @param callback
     * @returns {Array|undefined}
     *
     * @deprecated
     */
    Context.prototype.find = function (staticIds, callback) {
        if (typeof staticIds === 'function') {
            callback = staticIds;
            staticIds = undefined;
        } else if (typeof staticIds === 'string') {
            staticIds = [staticIds];
        }

        if (typeof callback !== 'function') {
            return;
        }

        var children = this._component.children(),
            componentRegistry = ClientRenderer.get().getComponentRegistry(),
            wrongStaticIds = [],
            promises = [],
            self = this;

        if (!staticIds) {
            staticIds = children.map(function (child) { return child.staticId; });
        }

        for (var i = 0, len = staticIds.length; i < len; i++) {
            var child = this._component.getChildByStaticId(staticIds[i]);
            if (child) {
                promises.push(componentRegistry.getComponent(child.instanceId));
            } else {
                wrongStaticIds.push(staticIds[i]);
            }
        }

        if (wrongStaticIds.length > 0) {
            return wrongStaticIds;
        }

        all(promises).then(function (components) {
            var controllerPromises = components.map(function (component) {
                var deferred = defer();

                component.once('init', function () {
                    deferred.resolve(component.controller);
                });

                return deferred.promise;
            });

            all(controllerPromises).then(function (controllers) {
                if (controllers.length === 1) {
                    callback.call(controllers[0], controllers[0]);
                } else {
                    callback.apply(self._component.controller(), controllers);
                }
            });
        });
    };

    /**
     * Gets the controller of the parent component. It returns a promise if the parent isn't loaded
     * yet. This is an internal framework method.
     *
     * @returns {promise}
     */
    Context.prototype._getParent = function () {
        var parentInstanceId = this._component.parentInstanceId();

        if (!parentInstanceId) {
            return null;
        }

        var parent = ClientRenderer.get().getComponentRegistry().getComponent(parentInstanceId),
            deferred = defer();

        when(parent, function (parent) {
            parent.on('start', function () {
                deferred.resolve(parent.controller());
            })
        });

        return deferred.promise;
    };

    return Context;
});

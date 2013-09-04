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
        'raintime/messaging/sockets'
], function (ClientStorage, Observer, Intents, SocketHandler) {

    /**
     * The context reflects a component's client-side state. It gives access to other
     * important libraries like client storage, messaging and web sockets.
     *
     * @name Context
     * @class
     * @constructor
     *
     * @param {Raintime} raintimeInstance
     * @param {Component} component the component object
     *
     * @property {String} instanceId the component's instance id
     * @property {ClientStorage} storage the local storage manager
     */
    function Context(component) {
        var self = this;

        this.component = {
            id: component.id,
            version: component.version,
            sid: component.staticId,
            children: component.children
        };

        this.instanceId = component.instanceId();
        this.parentInstanceId = component.parentInstanceId;
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
                    channel = '/' + self.component.id + '/' + self.component.version + '/' + channel;
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
       return $("#" + this.instanceId);
    };

    /**
     * Insert a new component into the given DOM Element and set a function that will be called
     * after the controller for the new controller was loaded.
     *
     * The context for the callback function will be the component's controller.
     */
    Context.prototype.insert = function (component, element, callback) {

        var self = this;

        ClientRenderer.get().insertComponent(component, element, this.instanceId).then(function (registeredComponent) {
            registeredComponent.controller.context.parentInstanceId = self.instanceId;
            callback && callback.call(registeredComponent.controller, registeredComponent);
        }, function () {
            //TODO: what happens on error
        });

    };

    /**
     * Replaces the component from where it is called with the given component and set a
     * function that will be called after the controller for the new component was loaded.
     *
     * The context for the callback function will be the component's controller.
     *
     */
    Context.prototype.replace = function (component, callback) {

        var self = this;

        ClientRenderer.get().replaceComponent(component, this.instanceId).then(function (registeredComponent) {
            registeredComponent.controller.context.parentInstanceId = self.instanceId;
            callback && callback.call(registeredComponent.controller, registeredComponent);
        }, function () {
            //TODO: do something if error
        });
    };

    /**
     * Removes a child component.
     *
     * @param {String} staticId the child static id
     */
    Context.prototype.remove = function (staticId) {
        var children = this.component.children,
            childInstanceId,
            componentRegistry = ClientRenderer.get().getComponentRegistry();

        if (!children) {
            return;
        }

        for (var i = 0, len = children.length; i < len; i++) {
            if (children[i].staticId === staticId) {
                childInstanceId = children[i].instanceId;
                componentRegistry.deregister(childInstanceId);
                children.splice(i, 1);
                $("#" + childInstanceId).remove();
                break;
            }
        }
    };

    /**
     * Gets the controller of the parent component. It returns a promise if the parent isn't loaded
     * yet. This is an internal framework method.
     *
     * @name _getParent
     * @memberOf Context#
     * @private
     * @returns {Controller|Promise}
     */

    Context.prototype.find = function (staticIds, callback) {

        var component = this.component,
            componentRegistry = ClientRenderer.get().getComponentRegistry();

        if (!component.children) {
            //logger.error('The component has no registered children: ' +
            //    (component && JSON.stringify(staticId)));
            return;
        }

        var children = component.children;

        var promises = [];

        if (!staticIds) {
            for (var i = 0, len = children.length; i < len; i++) {
                var childInstanceId = children[i].instanceId,
                    child = componentRegistry.find(childInstanceId);
                if (child) {
                    promises.push(child.promise);
                }
            }
        } else {
            var wrongStaticIds = [];
            for (var j = 0, len = staticIds.length; j < len; j++) {
                var staticId = staticIds[j],
                    found = false;

                for (var i = children.length; i--;) {
                    var childInstanceId = children[i].instanceId,
                        child = componentRegistry.find(childInstanceId);
                    if (child && child.staticId === staticId) {
                        promises.push(child.promise);
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
    };

    Context.prototype._getParent = function () {
        var parentInstanceId = this.parentInstanceId,
            parent = ClientRenderer.get().getComponentRegistry.find(parentInstanceId);

        // return a promise if the controller isn't loaded yet
        return parent && (parent.controller || parent.promise);
    };

    return Context;
});

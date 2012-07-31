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
], function (ClientStorage, Observer, Intents, Sockets) {

    var raintime = null;

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
    function Context(raintimeInstance, component) {
        var self = this;

        raintime = raintimeInstance;
        this.instanceId = component.instanceId;
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
             * @memberOf Context.messaging
             */
            subscribe: function (eventName, callback) {
                Observer.subscribe(eventName, callback, self);
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
            getSocket: Sockets.getSocket
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
     *
     * @param {Object} component The component which to be requested
     * @param {String} component.id The component id
     * @param {String} component.version The component version
     * @param {String} component.view The component view id
     * @param {String} component.sid The component staticId id
     * @param {Object} component.context Custom data for the template
     * @param {Boolean} component.placeholder Enable / Disable placeholder
     * @param {jQueryDom} dom The dom object where the component is inserted
     * @param {Function} [callback] the function to be called after the controller was loaded
     */
    Context.prototype.insert = function (component, dom, callback) {
        var staticId = component.sid || Math.floor(Math.random(0, Date.now()));
        var instanceId = (
                Date.now().toString() +
                (++window.ClientRenderer.get().counter) +
                staticId + this.instanceId
        );
        $(dom).html('<div id="' + instanceId + '"></div>');
        component.instanceId = instanceId;
        raintime.componentRegistry.setCallback(instanceId, callback);
        window.ClientRenderer.get().requestComponent(component);
    };

    /**
     * Replaces the component from where it is called with the given component and set a
     * function that will be called after the controller for the new component was loaded.
     *
     * The context for the callback function will be the component's controller.
     *
     * @param {Object} component The component which to be requested
     * @param {String} component.id The component id
     * @param {String} component.view The component view id
     * @param {String} component.sid The component staticId id
     * @param {Object} component.context Custom data for the template
     * @param {Boolean} component.placeholder Enable / Disable placeholder
     * @param {Function} [callback] the function to be called after the controller was loaded
     */
    Context.prototype.replace = function (component, callback) {
        component.instanceId = this.instanceId;
        raintime.componentRegistry.setCallback(component.instanceId, callback);
        window.ClientRenderer.get().requestComponent(component);
    };

    return Context;
});

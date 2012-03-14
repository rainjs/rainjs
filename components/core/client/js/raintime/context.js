define(["core/js/raintime/client_storage", "core/js/raintime/messaging_observer"],
       function (ClientStorage, Observer) {

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
                Observer.subscribe(eventName, callback, this);
            },

            /**
             * Unsubscribe from an event.
             *
             * @param {String} eventName Event name we want to subscribe to. Can be any string value.
             * @param {Function} callback This is the callback method that will get executed. It must have a single parameter called data. e.g.: function(data)
             * @memberOf Context.messaging
             */
            unsubscribe: function (eventName, callback) {
                Observer.unsubscribe(eventName, callback, this);
            },

            /**
             * This is the method that will publish an event and will execute all registered callbacks.
             *
             * @param {String} eventName
             * @param {Object} data
             * @memberOf Context.messaging
             */
            publish: function (eventName, data) {
                Observer.publish(eventName, data, this);
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
       return $("[id='" + this.instanceId + "']"); 
    };

    return Context;
});

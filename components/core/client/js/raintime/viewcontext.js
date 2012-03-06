/**
 * @fileOverview The view context associated with the client side controller
 * @name View Context
 */
define(["core/js/client_util",
        "core/js/raintime/client_storage",
        "core/js/raintime/messaging_observer",
        "core/js/raintime/messaging",
        "core/js/raintime/view_manager"],
        function (ClientUtil, ClientStorage, Observer, Messaging, ViewManager) {

    /**
     * A view context reflects a components client-side state.
     *
     * @name ViewContext
     * @constructor
     * @property {String} moduleId The component's module id
     * @property {String} instanceId The component's instance id
     * @property {Object} parent
     * @property {ClientStorage} storage The local storage manager
     * @property {ViewManager} viewManager The view manager that handles subsequent view requests
     * @param {Object} component
     * @param {String} component.id
     * @param {Object} component.parent
     * @param {String} component.moduleId
     */
    function ViewContext(component) {
        this.moduleId = component.moduleId;
        this.instanceId = component.id;
        this.parent = component.parent;
        this.storage = new ClientStorage(this);
        this.viewManager = new ViewManager(this, Messaging.messaging);
    }

    /**
     * Method used to obtain a web socket for which a handler was defined into this
     * component.
     *
     * @param url
     * @returns {Socket}
     */
    ViewContext.prototype.getWebSocket = function (url) {
        return Messaging.messaging._getWebSocket(this.moduleId, url);
    }

    /**
     * Returns the DOM container element for the component associated with this
     * view context.
     *
     * @returns {jQueryElement} The component's container jQuery element
     */
    ViewContext.prototype.getRoot = function () {
       return $("[data-instanceid='" + this.instanceId + "']"); 
    }

    /**
     * This is the method that allows registration of a callback method to a
     * desired event.
     *
     * @param {String} eventName Event name we want to subscribe to. Can be any string value.
     * @param {Function} callback This is the callback method that will get executed. It must have a single parameter called data. e.g.: function(data)
     */
    ViewContext.prototype.subscribe = function (eventName, callback) {
        Observer.subscribe(eventName, callback, this);
    }

    /**
     * Unsubscribe from an event.
     *
     * @param {String} eventName Event name we want to subscribe to. Can be any string value.
     * @param {Function} callback This is the callback method that will get executed. It must have a single parameter called data. e.g.: function(data)
     */
    ViewContext.prototype.unsubscribe = function (eventName, callback) {
        Observer.unsubscribe(eventName, callback, this);
    }

    /**
     * This is the method that will publish an event and will execute all registered callbacks.
     *
     * @param {String} eventName
     * @param {Object} data
     */
    ViewContext.prototype.publish = function (eventName, data) {
        Observer.publish(eventName, data, this);
    }

    return {
        addViewContext: function (component) {
            return new ViewContext(component);
        }
    };
});

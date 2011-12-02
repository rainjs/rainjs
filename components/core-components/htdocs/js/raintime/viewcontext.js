/**
 * @fileOverview The view context associated with the client side controller
 * @name View Context
 */
define(["core-components/client_util",
        "core-components/raintime/client_storage",
        "core-components/raintime/messaging_observer",
        "core-components/raintime/messaging",
        "core-components/raintime/view_manager"],
        function (ClientUtil, ClientStorage, Observer, Messaging, ViewManager) {

    /**
     * A view context reflects a components client-side state.
     *
     * @constructor
     * @property moduleId The component's module id
     * @property instanceId The component's instance id
     * @property parent 
     * @property {ClientStorage} storage The local storage manager
     * @property {ViewManager} viewManager The view manager that handles subsequent view requests
     * @param component
     * @param component.id
     * @param component.parent
     * @param component.moduleId
     */
    function ViewContext(component) {
        this.moduleId = component.moduleId;
        this.instanceId = component.id;
        this.parent = component.parent;
        this.storage = new ClientStorage(this);
        this.viewManager = new ViewManager(this);
    }

    /**
     * Method used to obtain a web socket for which a handler was defined into this
     * component.
     *
     * @param url
     */
    ViewContext.prototype.getWebSocket = function (url) {
        return Messaging.messaging._getWebSocket(this.moduleId, url);
    }

    /**
     * Returns the DOM container element for the component associated with this
     * view context.
     *
     * @returns The component's container jQuery element
     */
    ViewContext.prototype.getRoot = function () {
       return $("[data-instanceid='" + this.instanceId + "']"); 
    }

    /**
     * This is the method that allows registration of a callback method to a
     * desired event.
     *
     * @param eventName Event name we want to subscribe to. Can be any string value.
     * @param callback This is the callback method that will get executed. It must have
     *                     a single parameter called data.
     *             Ex: function(data)
     */
    ViewContext.prototype.subscribe = function (eventName, callback) {
        Observer.subscribe(eventName, callback, this);
    }

    /**
     * Unsubscribe from an event
     *
     * @param eventName Event name we want to subscribe to. Can be any string value.
     * @param callback This is the callback method that will get executed. It must have
     *                     a single parameter called data.
     *             Ex: function(data)
     */
    ViewContext.prototype.unsubscribe = function (eventName, callback) {
        Observer.unsubscribe(eventName, callback, this);
    }

    /**
     * This is the method that will publish an event
     * and will execute all registered callbacks.
     *
     * @param eventName
     * @param data
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

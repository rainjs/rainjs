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

define([
    'raintime/lib/event_emitter',
    'raintime/lib/util',
    'raintime/lib/promise'
], function (EventEmitter, util, Promise) {

    var when = Promise.when;

    /**
     * Stores the data associated with a component.
     *
     * @param {Object} componentData the data sent by the server for a rendered component
     *
     * @name Component
     * @constructor
     */
    function Component(componentData) {
        /**
         * The component id.
         *
         * @type {String}
         * @private
         */
        this._id = componentData.id;

        /**
         * The component version.
         *
         * @type {String}
         * @private
         */
        this._version = componentData.version;

        /**
         * The instance id.
         *
         * @type {String}
         * @private
         */
        this._instanceId = componentData.instanceId;

        /**
         * The instance id of the parent component. The only component for which the parent
         * instance id is not defined is the main component.
         *
         * @type {String}
         * @private
         */
        this._parentInstanceId = componentData.parentInstanceId;

        /**
         * The static id.
         *
         * @type {String}
         * @private
         */
        this._staticId = componentData.staticId || componentData.instanceId;

        /**
         * The HTML markup for this component instance.
         *
         * @type {String}
         * @private
         */
        this._html = componentData.html;

        /**
         * The instance id of the container in which this component is rendered. Has a value
         * only when the component is rendered inside a container.
         *
         * @type {String}
         * @private
         */
        this._containerId = componentData.containerId;

        /**
         * The container in which the markup for the component is placed.
         *
         * @type {jQuery}
         * @private
         */
        this._rootElement = null;

        /**
         * The client-side controller path.
         *
         * @type {String}
         * @private
         */
        this._controllerPath = '';

        /**
         * The client-side controller instance.
         *
         * @type {Controller}
         * @private
         */
        this._controller = null;

        /**
         * List containing the path and rule count for the CSS files associated with this
         * component.
         *
         * @type {Array}
         * @private
         */
        this._css = componentData.css;

        /**
         * List of instance id, static id and placeholder for the component's children.
         *
         * @type {Array}
         * @private
         */
        this._children = [];

        /**
         * Maps an instance id to the index in the children array.
         *
         * @type {Object}
         * @private
         */
        this._instanceIdMap = {};

        /**
         * Maps a static id to the index in the children array.
         *
         * @type {Object}
         * @private
         */
        this._staticIdMap = {};

        if (componentData.controller) {
            // strips the leading / and the .js extension
            this._controllerPath = componentData.controller.replace(/^\/?(.*?)(.js)?$/, '$1');
        }

        for (var i = 0, len = componentData.children.length; i < len; i++) {
            var child = componentData.children[i],
                newChild = {
                    staticId: child.staticId || child.instanceId,
                    instanceId: child.instanceId,
                    placeholder: child.placeholder
                };

            this._children.push(newChild);

            this._instanceIdMap[newChild.instanceId] = i;
            this._staticIdMap[newChild.staticId] = i;
        }

        this._state = null;
    }

    util.inherits(Component, EventEmitter);

    Component.INIT = 'init';
    Component.START = 'start';
    Component.ERROR = 'error';
    Component.DESTROY = 'destroy';

    /**
     * Gets/sets the component's lifecycle state. Invokes the component lifecycle when a new
     * state is set.
     *
     * @param {String} [state] the state to be set
     * @param {Error} [error] indicates the error when the state is error
     * @returns {String|Component}
     */
    Component.prototype.state = function (state, error) {
        var self = this;

        if (typeof state === 'undefined') {
            return this._state;
        }

        var controller = this.controller();

        // the controller can be null if an error occurs while loading the controller
        when(controller && controller[state](error),
            function () {
                self._state = state;
                self.emit(state, error);
            }, function (error) {
                self.state(Component.ERROR, error);
            }
        );

        return this;
    };

    /**
     * Overrides EventEmitter#on in order to emit events for states that were already set.
     *
     * @param {String} eventName
     * @param {Function} callback
     */
    Component.prototype.on = function (eventName, callback) {
        if (this.hasState(eventName)) {
            callback.call(this);
            return;
        }

        EventEmitter.prototype.on.call(this, eventName, callback);
    };

    /**
     * Determines if a state already set
     *
     * @param {String} state
     * @returns {Boolean}
     */
    Component.prototype.hasState = function (state) {
        return this.state() === state ||
            (state === Component.INIT && this.state() === Component.START);
    };


    /**
     * Gets the component id.
     *
     * @returns {String}
     */
    Component.prototype.id = function () {
        return this._id;
    };

    /**
     * Gets the component version.
     *
     * @returns {String}
     */
    Component.prototype.version = function () {
        return this._version;
    };

    /**
     * Gets an id constructed by concatenating id and version.
     *
     * @returns {String}
     */
    Component.prototype.uniqueId = function () {
        return this.id() + ';' + this.version();
    };

    /**
     * Gets the instance id.
     *
     * @returns {String}
     */
    Component.prototype.instanceId = function () {
        return this._instanceId;
    };

    /**
     * Gets the instance id of the parent component.
     *
     * @returns {String}
     */
    Component.prototype.parentInstanceId = function () {
        return this._parentInstanceId;
    };

    /**
     * Gets the static id.
     *
     * @returns {String}
     */
    Component.prototype.staticId = function () {
        return this._staticId;
    };

    /**
     * Gets the instance id of the container in which the component was rendered, if it exists.
     *
     * @returns {String}
     */
    Component.prototype.containerId = function () {
        return this._containerId;
    };

    /**
     * Gets the HTML markup of the component.
     *
     * @returns {String}
     */
    Component.prototype.html = function () {
        return this._html;
    };

    /**
     * Gets the css class that should be set on the root element.
     *
     * @returns {String}
     */
    Component.prototype.cssClass = function () {
        return 'app-container ' + this.id() + '_' + this.version().replace(/\./g, '_');
    };

    /**
     * Gets the container in which the markup for the component is placed.
     *
     * @returns {jQuery}
     */
    Component.prototype.rootElement = function () {
        if (!(this._rootElement && this._rootElement.length !== 0)) {
            this._rootElement = $('#' + this.instanceId());
        }

        return this._rootElement;
    };

    /**
     * Gets the path of the client-side controller.
     *
     * @returns {String}
     */
    Component.prototype.controllerPath = function () {
        return this._controllerPath;
    };

    /**
     * Gets/sets the client-side controller instance.
     *
     * @param {Controller} [controller]
     * @returns {Controller|Component}
     */
    Component.prototype.controller = function (controller) {
        if (typeof controller === 'undefined') {
            return this._controller;
        }

        this._controller = controller;
        return this;
    };

    /**
     * Gets the list of children.
     *
     * @returns {Array}
     */
    Component.prototype.children = function () {
        return this._children;
    };

    /**
     * Gets the child associated with the specified instance id.
     *
     * @param {String} instanceId
     * @returns {Object} a child object having instanceId, staticId and placeholder properties
     */
    Component.prototype.getChildByInstanceId = function (instanceId) {
        var index = this._instanceIdMap[instanceId];

        if (typeof index !== 'undefined') {
            return this._children[index];
        }

        return null;
    };

    /**
     * Gets the child associated with the specified static id.
     *
     * @param {String} staticId
     * @returns {Object} a child object having instanceId, staticId and placeholder properties
     */
    Component.prototype.getChildByStaticId = function (staticId) {
        var index = this._staticIdMap[staticId];

        if (typeof index !== 'undefined') {
            return this._children[index];
        }

        return null;
    };

    /**
     * Adds a child to the children array.
     *
     * @param {Object} child
     * @param {String} child.instanceId
     * @param {String} child.staticId
     * @param {Boolean} [child.placeholder = false]
     */
    Component.prototype.addChild = function (child) {
        this._children.push(child);
        this._staticIdMap[child.staticId] = this._children.length - 1;
        this._instanceIdMap[child.instanceId] = this._children.length - 1;
    };

    /**
     * Removes a child from the children array.
     *
     * @param {String} staticId
     */
    Component.prototype.removeChild = function (staticId) {
        var index = this._staticIdMap[staticId],
            self = this;

        if (typeof index === 'undefined') {
            return;
        }

        this._children.splice(index, 1);

        this._staticIdMap = {};
        this._instanceIdMap = {};

        this._children.forEach(function (child, index) {
            self._staticIdMap[child.staticId] = index;
            self._instanceIdMap[child.instanceId] = index;
        });
    };

    /**
     * Gets the list of css files for this component. For each file path and ruleCount properties
     * are defined.
     *
     * @returns {Array}
     */
    Component.prototype.css = function () {
        return this._css;
    };

    return Component;
});

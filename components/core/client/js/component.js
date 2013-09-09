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
     *
     * @param componentData
     * @constructor
     */
    function Component(componentData) {
        this._id = componentData.id;
        this._version = componentData.version;
        this._instanceId = componentData.instanceId;
        this._parentInstanceId = componentData.parentInstanceId;
        this._staticId = componentData.staticId;
        this._html = componentData.html;
        this._containerId = componentData.containerId;
        this._rootElement = null;
        this._controllerPath = '';
        this._controller = null;
        this._css = componentData.css;

        if (componentData.controller) {
            this._controllerPath = componentData.controller.replace(/^\/?(.*?)(.js)?$/, '$1');
        }

        this._children = [];
        this._instanceIdMap = {};
        this._staticIdMap = {};

        for (var i = 0, len = componentData.children.length; i < len; i++) {
            var child = componentData.children[i],
                index = this._children.length;

            this._children.push({
                staticId: child.staticId || child.instanceId,
                instanceId: child.instanceId,
                placeholder: child.placeholder
            });

            child = this._children[index];
            this._instanceIdMap[child.instanceId] = index;
            this._staticIdMap[child.staticId] = index;
        }

        this._state = null;
    }

    util.inherits(Component, EventEmitter);

    Component.INIT = 'init';
    Component.START = 'start';
    Component.ERROR = 'error';
    Component.DESTROY = 'destroy';

    /**
     *
     * @param [state]
     * @param [error]
     * @returns {*}
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

    Component.prototype.on = function (eventName, callback) {
        if (this.hasState(eventName)) {
            callback.call(this);
            return;
        }

        EventEmitter.prototype.on.call(this, eventName, callback);
    };

    Component.prototype.hasState = function (state) {
        return this.state() === state ||
            (state === Component.INIT && this.state() === Component.START);
    };


    Component.prototype.id = function () {
        return this._id;
    };

    Component.prototype.version = function () {
        return this._version;
    };

    Component.prototype.uniqueId = function () {
        return this.id() + ';' + this.version();
    };

    Component.prototype.instanceId = function () {
        return this._instanceId;
    };

    Component.prototype.parentInstanceId = function () {
        return this._parentInstanceId;
    };

    Component.prototype.staticId = function () {
        return this._staticId || this._instanceId;
    };

    Component.prototype.containerId = function () {
        return this._containerId;
    };

    Component.prototype.html = function () {
        return this._html;
    };

    Component.prototype.cssClass = function () {
        return 'app-container ' + this.id() + '_' + this.version().replace(/\./g, '_');
    };

    Component.prototype.rootElement = function () {
        if (!(this._rootElement && this._rootElement.length === 0)) {
            this._rootElement = $('#' + this.instanceId());
        }

        return this._rootElement;
    };

    Component.prototype.controllerPath = function () {
        return this._controllerPath;
    };

    Component.prototype.controller = function (controller) {
        if (typeof controller === 'undefined') {
            return this._controller;
        }

        this._controller = controller;
        return this;
    };

    /**
     * [{instanceId, staticId, placeholder}]
     */
    Component.prototype.children = function () {
        return this._children;
    };

    Component.prototype.getChildByInstanceId = function (instanceId) {
        var index = this._instanceIdMap[instanceId];

        if (typeof index !== 'undefined') {
            return this._children[index];
        }

        return null;
    };

    Component.prototype.getChildByStaticId = function (staticId) {
        var index = this._staticIdMap[staticId];

        if (typeof index !== 'undefined') {
            return this._children[index];
        }

        return null;
    };

    Component.prototype.addChild = function (child) {
        this._children.push(child);
        this._staticIdMap[child.staticId] = this._children.length - 1;
        this._instanceIdMap[child.instanceId] = this._children.length - 1;
    };

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
     * [
     *    {"path":"/example/3.0/css/index.css","ruleCount":7},
     *    {"path":"/example/3.0/css/jquery-ui-1.10.2.custom.css","ruleCount":357}
     * ]
     *
     *
     * @returns {Array}
     */
    Component.prototype.css = function () {
        return this._css;
    };

    return Component;
});

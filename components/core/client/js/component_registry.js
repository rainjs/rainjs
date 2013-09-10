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
    'raintime/component',
    'raintime/css/renderer',
    'raintime/controller',
    'raintime/lib/promise',
    'raintime/lib/event_emitter',
    'raintime/lib/util'
], function (Component, CssRenderer, BaseController, Promise, EventEmitter, util) {

    var all = Promise.all,
        seq = Promise.seq,
        defer = Promise.defer;

    /**
     * Keeps information about the components in the page, loads the CSS and JavaScript
     * associated with them and invokes the component lifecycle.
     *
     * @name ComponentRegistry
     * @constructor
     */
    function ComponentRegistry() {
        /**
         * A hash containing the registered components indexed by instance id.
         *
         * @type {Object}
         * @private
         */
        this._componentMap = {};

        /**
         * Contains known instance ids that aren't registered yet.
         *
         * @type {Object}
         * @private
         */
        this._waitInstanceIds = {};

        /**
         * The CssRenderer instance.
         *
         * @type {CssRenderer}
         * @private
         */
        this._cssRenderer = CssRenderer.get();
    }

    util.inherits(ComponentRegistry, EventEmitter);

    /**
     * Registers a component.
     *
     * @param {Component} component the component to be registered.
     *
     * @throws {RainError} when the component parameter is not specified
     * @throws {RainError} when a component with the same instance id is already registered
     */
    ComponentRegistry.prototype.register = function (component) {
        if (!component) {
            throw new RainError('The component parameter is mandatory');
        }

        if (this._componentMap[component.instanceId()]) {
            throw new RainError('A component with the same instance id is already registered: '
                + component.instanceId());
        }

        var instanceId = component.instanceId();

        this._componentMap[instanceId] = component;

        if (this._waitInstanceIds[instanceId]) {
            this._waitInstanceIds[instanceId].resolve(component);
            delete this._waitInstanceIds[instanceId];
        }
    };

    /**
     * Adds an instance id to the list of known instance id. These are the instance ids of a
     * rendered component children or of the components that were requested via web sockets.
     *
     * @param {String} instanceId
     */
    ComponentRegistry.prototype.waitInstanceId = function (instanceId) {
        this._waitInstanceIds[instanceId] = defer();
    };

    /**
     * Gets the component associated with the specified instance id.
     *
     * @param {String} instanceId the instanceId of the component.
     *
     * @returns {Component|promise}
     */
    ComponentRegistry.prototype.getComponent = function (instanceId) {
        if (this._componentMap[instanceId]) {
            return this._componentMap[instanceId];
        }

        if (this._waitInstanceIds[instanceId]) {
            return this._waitInstanceIds[instanceId].promise;
        }

        return null;
    };

    /**
     * Gets the parent component for the specified instance id.
     *
     * @param {String} instanceId
     * @returns {Component}
     */
    ComponentRegistry.prototype.getParent = function (instanceId) {
        for (var key in this._componentMap) {
            var component = this._componentMap[key];
            if (component.getChildByInstanceId(instanceId)) {
                return component;
            }
        }

        return null;
    };

    /**
     * De-registers a component.
     *
     * @param {String} instanceId the component's instance id
     */
    ComponentRegistry.prototype.deregister = function (instanceId) {
        var component = this._componentMap[instanceId];

        if(!component) {
            return;
        }

        var children = component.children();
        for (var i = 0, len = children.length; i < len; i++) {
            this.deregister(children[i].instanceId);
        }

        component.state(Component.DESTROY);
        this._cssRenderer.unload(component);
        delete this._componentMap[instanceId];
    };

    /**
     * Loads the client-side controller and the CSS for the specified component and invokes the
     * component lifecycle.
     *
     * @param {Component} component
     * @returns {promise}
     */
    ComponentRegistry.prototype.load = function (component) {
        var deferred = defer(),
            self = this;

        seq([
            function () {
                return all(self._cssRenderer.load(component), self._loadController(component));
            },
            function () {
                var deferred = defer();

                component.state(Component.START);
                component.once('start', function () {
                    deferred.resolve();
                });

                return deferred.promise;
            }
        ]).then(function () {
            deferred.resolve();
        }, function (error) {
            component.state(Component.ERROR);
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Loads the client-side controller for the specified component.
     *
     * @param {Component} component
     * @returns {promise}
     * @private
     */
    ComponentRegistry.prototype._loadController = function (component) {
        var self = this;

        return Promise.seq([
            function () {
                return self._requestController(component);
            },
            function (ComponentController) {
                var deferred = defer();

                var controller = self._instantiateController(component, ComponentController);
                component.controller(controller);
                component.state(Component.INIT);
                component.once('init', function () {
                    deferred.resolve();
                });

                return deferred.promise;
            }
        ]);
    };

    /**
     * Requires the client-side controller module for the specified component.
     *
     * @param {Component} component
     * @returns {promise}
     * @private
     */
    ComponentRegistry.prototype._requestController = function (component) {
        var deferred = Promise.defer();

        var minFilePath = '';
        if (rainContext.enableMinification) {
            minFilePath = component.id() + '/' + component.version() + '/js/index.min';
        }

        require([minFilePath], function () {
            require([component.controllerPath()], function (Controller) {
                deferred.resolve(Controller);
            });
        });

        return deferred.promise;
    };

    /**
     * Creates the client-side controller instance.
     *
     * @param {Component} component
     * @param {Function} ComponentController the client-side controller constructor
     *
     * @returns {Controller} the controller instance
     * @private
     */
    ComponentRegistry.prototype._instantiateController = function (component, ComponentController) {
        if (!ComponentController) {
            ComponentController = function () {};
        }

        var Controller = function (component) {
            BaseController.call(this, component);
            ComponentController.call(this);
        };

        Controller.prototype = $.extend(
            {},
            BaseController.prototype,
            ComponentController.prototype
        );

        return new Controller(component);
    };

    return ComponentRegistry;
});


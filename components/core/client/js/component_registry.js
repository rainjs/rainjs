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
    'raintime/css/renderer',
    'raintime/controller',
    'raintime/lib/promise',
    'raintime/lib/event_emitter',
    'raintime/lib/util'
], function (CssRenderer, BaseController, Promise, EventEmitter, util) {

    /**
     *
     * @constructor
     */
    function ComponentRegistry() {
        this._componentMap = {};
    }

    util.inherits(ComponentRegistry, EventEmitter);

    /**
     * Registers a component in the component map.
     *
     * @param {Component} component the component that needs to be registered in the component map.
     */
    ComponentRegistry.prototype.register = function (component) {
        if (!component) {
            throw new RainError('The component parameter is mandatory');
        }

        if (this._componentMap(component.instanceId())) {
            throw new RainError('A component with the specified instance id is already registered: '
                + component.instanceId());
        }

        this._componentMap[component.instanceId()] = component;

        // TODO: modify the CSS renderer to use Component instances
        CssRenderer.get().load(component);
        this._loadController(component).then(function (Controller) {
            if (!Controller) {
                Controller = function () {};
            }

            var Constructor = function (component) {
                BaseController.call(this, component);
                Controller.call(this);
            };

            Constructor.prototype = $.extend({}, BaseController.prototype, Controller.prototype);

            var controller = new Constructor();

        });

            /*.then(function () {

        }, function (error) {
            logger.error('Failed to load CSS for: ' + component.uniqueId());
        });*/
    };

    ComponentRegistry.prototype._loadController = function (component) {
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
     * Finds a component in the component map depending on it's instance id.
     *
     * @param {String} componentId the instanceId of the component.
     */
    ComponentRegistry.prototype.findComponent = function (componentId) {

    };

    /**
     * Loads the CSS for a component.
     *
     * @param {Component} component the component for which you want to load the CSS.
     * @returns {Promise} a promise informing if the loading of the css was or not successful.
     * @private
     */
    ComponentRegistry.prototype._loadCSS = function (component) {
        var deferred = Promise.defer();

        /**
         * load the css for a component
         */

        return deferred.promise;
    };

    /**
     * Loads the javascript for a component.
     *
     * @param {Component} component the component for which you want to load the javascript.
     * @returns {Promise} a promise informing if the loading of the js was or not successful.
     * @private
     */
    ComponentRegistry.prototype._loadJS = function (component) {
        var deferred = Promise.defer(),
            controller = component.controller();

        if (controller) {
            require([controller], function (controller) {

            });
        }
        /**
         * load the js for a component
         */

        return deferred.promise;
    };

    /**
     * Gets the component map.
     *
     * @returns {Object} the componentMap.
     */
    ComponentRegistry.prototype.getMap = function () {
        return this._componentMap;
    };

    /**
     * Invokes the life cycle of a component.
     *
     * @param {Component} component the component for which the life cycle should be invoked.
     */
    ComponentRegistry.prototype.invokeLifeCycle = function (component) {

        /**
         * invoke the life cycle of the component.
         */
    };

    return ComponentRegistry;
});


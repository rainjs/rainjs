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

define(['raintime/lib/promise'], function (Promise) {

    /**
     *
     * @constructor
     */
    function ComponentRegistry() {
        this._componentMap = {};
    }

    /**
     * Registers a component in the component map.
     *
     * @param {Component} component the component that needs to be registerd in the component map.
     */
    ComponentRegistry.prototype.register = function (component) {
        if(!this._isRegistered(component.instanceId())) {
            this._componentMap[component.instanceId()] = component;
        }
    };


    /**
     * Verifies if a componentId is already in the component map.
     *
     * @param {String} componentId the instance id of the component.
     * @private
     */
    ComponentRegistry.prototype._isRegistered = function (componentId) {

        if(this._componentMap[componentId]) {
            return true;
        }

        return false;
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
        var deferred = Promise.defer();

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


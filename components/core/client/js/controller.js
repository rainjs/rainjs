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

define(['raintime/lib/event_emitter',
        'raintime/lib/promise',
        'raintime/lib/util',
        'raintime/component',
        'raintime/context'], function (EventEmitter, Promise, util, Component, Context) {

    var defer = Promise.defer,
        seq = Promise.seq,
        allKeys = Promise.allKeys;

    /**
     * Base class for the client-side controller.
     *
     * @param {Component} component
     *
     * @name {Controller}
     * @constructor
     */
    function Controller(component) {
        var self = this;

        /**
         * The view context.
         *
         * @type {Context}
         */
        this.context = new Context(component);


        /**
         * The component associated with this controller instance.
         *
         * @type {Component}
         * @private
         */
        this._component = component;

        this._component.on('init', function () {
            self.emit('init');
        });

        this._component.on('start', function () {
            self.emit('start');
        });
    }

    util.inherits(Controller, EventEmitter);

    /**
    * Overrides EventEmitter#on in order to emit events for states that were already set.
    *
    * @param {String} eventName
    * @param {Function} callback
    */
    Controller.on = function (eventName, callback) {
        if (this._component.hasState(eventName)) {
            callback.call(this);
            return;
        }

        EventEmitter.prototype.on.call(this, eventName, callback);
    };

    /**
     * Initialization lifecycle step invoked immediately after the controller is loaded.
     */
    Controller.prototype.init = function () {};

    /**
     * Startup lifecycle step invoked after the markup is in place and the CSS is loaded.
     */
    Controller.prototype.start = function () {};

    /**
     * This method is called if an error occurs while loading the component.
     *
     * @param {Error} error
     */
    Controller.prototype.error = function (error) {};

    /**
     * Lifecycle step invoked when the component is removed.
     */
    Controller.prototype.destroy = function () {};

    /**
     * Asynchronously waits for a child controller to become available and started.
     * If the child with the specified sid is not found, the promise is rejected with a RainError.
     *
     *
     * @param {String} staticId the child component's static id
     * @returns {promise} a promise to return the child controller after it has started
     *
     * @protected
     */
    Controller.prototype.getChild = function (staticId) {
        var deferred = defer(),
            child = this._component.getChildByStaticId(staticId),
            self = this;

        if (!child) {
            var error = new RainError('The static id "' + staticId + '" could not be found.');
            util.defer(deferred.reject.bind(self, error));
            return deferred.promise;
        }

        var registry = ClientRenderer.get().getComponentRegistry();

        seq([
            function () {
                return registry.getComponent(child.instanceId);
            },
            function (component) {
                component.on('start', function () {
                    deferred.resolve(component.controller());
                });
                component.on('error', deferred.reject);
            }
        ]);

        return deferred.promise;
    };

    /**
     * Asynchronously waits for a child controller to become available and started.
     * If the child with the specified sid is not found, the promise is rejected with a RainError.
     *
     *
     * @param {String} staticId the child component's static id
     * @returns {promise} a promise to return the child controller after it has started
     *
     * @protected
     * @deprecated use getChild instead
     */
    Controller.prototype._getChild = Controller.prototype.getChild;

    /**
     * Convenience method to bind an event handler to a controller and make sure the controller
     * is started first.
     *
     * @param {String} sid the component's static id
     * @param {String} eventName the event's name
     * @param {Function} eventHandler the event handler function
     *
     * @protected
     */
    Controller.prototype.onChild = function (sid, eventName, eventHandler) {
        var self = this;

        seq([
            function () {
                return self.getChild(sid);
            },
            function (controller) {
                controller.on(eventName, eventHandler);
            }
        ]);
    };

    /**
     * Convenience method to bind an event handler to a controller and make sure the controller
     * is started first.
     *
     * @param {String} sid the component's static id
     * @param {String} eventName the event's name
     * @param {Function} eventHandler the event handler function
     *
     * @protected
     * @deprecated use onChild instead
     */
    Controller.prototype._onChild = Controller.prototype.onChild;

    /**
     * Asynchronously loads multiple started controllers. If the 'sids' argument is missing, then
     * the method waits for all children of the current component to start.
     *
     * The promise will be resolved with an object where the keys are the controllers' sids and
     * the values are the controller objects.
     *
     * @param {Array} [staticIds] the static ids of the controllers to retrieve
     * @returns {Promise} a promise to load and start the controllers
     *
     * @protected
     */
    Controller.prototype.getChildren = function (staticIds) {
        var keys = {},
            self = this;

        if (!staticIds) {
            staticIds = this._component.children().map(function (child) {
                return child.staticId;
            });
        }

        staticIds.forEach(function (staticId) {
            keys[staticId] = self.getChild(staticId);
        });

        return allKeys(keys);
    };

    /**
     * Asynchronously loads multiple started controllers. If the 'sids' argument is missing, then
     * the method waits for all children of the current component to start.
     *
     * The promise will be resolved with an object where the keys are the controllers' sids and
     * the values are the controller objects.
     *
     * @param {Array} [staticIds] the static ids of the controllers to retrieve
     * @returns {Promise} a promise to load and start the controllers
     *
     * @protected
     * @deprecated use getChildren instead
     */
    Controller.prototype._getChildren = Controller.prototype.getChildren;

    return Controller;
});

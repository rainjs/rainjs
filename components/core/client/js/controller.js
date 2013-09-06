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
        when = Promise.when,
        seq = Promise.seq;

    function Controller(component) {
        var self = this;

        this.context = new Context(component);

        /**
         * Controllers for child components.
         *
         * @type {Object}
         */
        this._controllers = {};
        this._component = component;

        this._component.on('init', function () {
            self.emit('init');
        });

        this._component.on('start', function () {
            self.emit('start');
        });
    }

    util.inherits(Controller, EventEmitter);

    Controller.on = function (eventName, callback) {
        if (this._component.hasState(eventName)) {
            callback.call(this);
            return;
        }

        EventEmitter.prototype.on.call(this, eventName, callback);
    };

    /**
     * Base init method of controller
     */
    Controller.prototype.init = function () {};

    /**
     * Base start method of controller
     */
    Controller.prototype.start = function () {};

    /**
     *
     * @param error
     */
    Controller.prototype.error = function (error) {};

    /**
     * Base destroy method of controller
     */
    Controller.prototype.destroy = function () {};

    /**
     * Removes a cached controller.
     *
     * @param {String} staticId the child's static id
     */
    Controller.prototype._clear = function (staticId) {
        delete this._controllers[staticId];
    };

    /**
     * Asynchronously waits for a child controller to become available and start.
     * The started controllers are cached. If the controller is found in the cache, the promise
     * is resolved at the next tick.
     *
     * If the child with the specified sid is not found, the promise is rejected with a RainError.
     *
     * @public
     *
     * @param {String} staticId the child component's static id
     * @returns {promise} a promise to return the child controller after it has started
     */
    Controller.prototype._getChild = function (staticId) {
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
     * Convenience method to bind an event handler to a controller and make sure the controller
     * is started first.
     *
     * @public
     *
     * @param {String} sid the component's static id
     * @param {String} eventName the event's name
     * @param {Function} eventHandler the event handler function
     */
    Controller.prototype._onChild = function (sid, eventName, eventHandler) {
        var self = this;

        seq([
            function () {
                return self._getChild(sid);
            },
            function (controller) {
                controller.on(eventName, eventHandler);
            }
        ]);
    };

    /**
     * Asynchronously loads multiple started controllers. If the 'sids' argument is missing, then
     * the method waits for all children (with a sid value non-empty) of the current component to
     * start.
     *
     * The promise will be resolved with an object where the keys are the controllers' sids and
     * the values are the controller objects.
     *
     * @public
     *
     * @param {Array} [sids] the static ids of the controllers that needed to be started
     * @returns {Promise} a promise to load and start the controllers
     */
    Controller.prototype._getChildren = function (sids) {
        var keys = {};

        if (!sids) {
            var children = this._component.children();
            for (var i = 0, len = children.length; i < len; i++) {
                var sid = children[i].staticId;
                if (sid) {
                    keys[sid] = this._getChild(sid);
                }
            }
        } else {
            for (var i = 0, len = sids.length; i < len; i++) {
                var sid = sids[i];
                keys[sid] = this._getChild(sid);
            }
        }

        return Promise.allKeys(keys);
    };


    return Controller;
});

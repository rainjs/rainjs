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

define(['raintime/lib/util',
        'raintime/lib/promise',
        'raintime/lib/step'
], function (Util, Promise, Step) {

    "use strict";

    var step = Step.Step,
        allKeys = Promise.allKeys,
        defer = Promise.defer;

    /**
     * This class contains utility functions that a component's client side controller can use to
     * get references to the controllers of its direct children. Every controller inherits these
     * methods by default.
     *
     * @name AsyncController
     * @class
     * @constructor
     */
    function AsyncController() {

        /**
         * Controllers for child components.
         *
         * @type {Object}
         */
        this._controllers = {};
    }

    /**
     * Removes a cached controller.
     *
     * @param {String} staticId the child's static id
     */
    AsyncController.prototype._clear = function (staticId) {
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
     * @param {String} sid the child component's static id
     * @returns {Promise} a promise to return the child controller after it has started
     */
    AsyncController.prototype._getChild = function (sid) {
        var deferred = defer(),
            self = this;

        if (self._controllers[sid]) {
            Util.defer(deferred.resolve.bind(self, self._controllers[sid]));
        } else {
            var wrongStaticIds = self.context.find(sid, function () {
                var controller = this;

                controller.on('start', function () {
                    self._controllers[sid] = controller;
                    deferred.resolve(controller);
                });
            });

            if (Array.isArray(wrongStaticIds)) {
                var error = new RainError('The static id "' + sid + '" could not be found.');
                Util.defer(deferred.reject.bind(self, error));
            }
        }

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
    AsyncController.prototype._onChild = function (sid, eventName, eventHandler) {
        step(this, [
            function () {
                return this._getChild(sid);
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
    AsyncController.prototype._getChildren = function (sids) {
        var keys = {};

        if (!sids) {
            var children = this.context.component.children;
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

        return allKeys(keys);
    };

    return AsyncController;
});

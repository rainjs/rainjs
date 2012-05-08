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

define(['util'], function(ClientUtil) {
    /** @private */
    var queue = {};

    /** @private */
    var orphans = {};

    /**
     * This is the method that will publish an event
     * and will execute all registered callbacks.
     *
     * @param eventName
     * @param data
     * @param viewContext the ViewContext of the component publishing the event
     */
    function publish(eventName, data, viewContext) {
        var hierarchy = eventName.split('::');
        var parent = queue;

        if (hierarchy[0] && viewContext && viewContext.parent) {
            // prepend parent
            hierarchy.splice(0, 0, viewContext.parent);
        } else {
            hierarchy.slice(1);
        }

        for (var i = 0, len = hierarchy.length; i < len; i++) {
            var child = hierarchy[i];

            if (!parent) {
                break;
            }

            parent = parent[child];
        }

        /**
         * Nobody is registered for this event so we simply exit this method.
         */
        if (!parent) {
            // take care of published events that no one subscribed to
            orphans[eventName] = data;

            return;
        }

        for(i = 0; i < parent.callbacks.length; i++) {
            ClientUtil.defer(ClientUtil.bind(parent.callbacks[i], parent, data));
        }
    }

    /**
     * This is the method that allows registration of a callback method to a
     * desired event.
     *
     * @param eventName Event name we want to subscribe to. Can be any string value.
     * @param callback This is the callback method that will get executed. It must have
     *                     a single parameter called data.
     *             Ex: function(data)
     * @param viewContext the ViewContext of the component publishing the event
     */
    function subscribe(eventName, callback, viewContext) {
        var hierarchy = eventName.split('::');
        var parent = queue;

        // take care of the orphaned events
        if(orphans.hasOwnProperty(eventName)) {
            callback(orphans[eventName]);

            delete orphans[eventName];
        }

        if (hierarchy[0] && viewContext && viewContext.parent) {
            // prepend parent
            hierarchy.splice(0, 0, viewContext.parent);
        } else {
            hierarchy.slice(1);
        }

        for (var i = 0, len = hierarchy.length; i < len; i++) {
            var child = hierarchy[i];
            if (!parent[child]) {
                parent[child] = {
                    callbacks: []
                };
            }

            parent = parent[child];
        }

        if (parent.callbacks.indexOf(callback) === -1) {
            parent.callbacks.push(callback);
        }
    }

    /**
     * Unsubscribe from an event
     *
     * @param eventName Event name we want to subscribe to. Can be any string value.
     * @param callback This is the callback method that will get executed. It must have
     *                     a single parameter called data.
     *             Ex: function(data)
     * @param viewContext the ViewContext of the component publishing the event
     */
    function unsubscribe(eventName, callback, viewContext) {
        var hierarchy = eventName.split('::');
        var parent = queue;

        if (hierarchy[0] && viewContext && viewContext.parent) {
            // prepend parent
            hierarchy.splice(0, 0, viewContext.parent);
        } else {
            hierarchy.slice(1);
        }

        for (var i = 0, len = hierarchy.length; i < len; i++) {
            var child = hierarchy[i];
            if (!parent[child]) {
                return;
            }

            parent = parent[child];
        }

        var foundIndex = parent.callbacks.indexOf(callback);

        if (foundIndex > -1) {
            parent.callbacks.splice(foundIndex, 1);
        }
    }

    /**
     * We return an instance of a queue to be used at page level.
     */
    return {
        'publish': publish,
        'subscribe': subscribe,
        'unsubscribe': unsubscribe
    };
});

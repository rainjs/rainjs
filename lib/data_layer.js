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

"use strict";

var path = require('path'),
    componentRegistry = require('./component_registry'),
    environment = require('./environment'),
    Translation = require('./translation');

/**
 * This module is used to call the server-side functions.
 *
 * @name DataLayer
 * @class
 * @constructor
 */
function DataLayer() {
    this.dataPath = 'server/data.js';
}

/**
 * Validates all necessary parameters and invokes the data function from the component
 * to receive custom data. When the data returns, it calls the callback function.
 *
 * @param {Object} componentOpt the component information
 * @param {Object} componentOpt.id the component id
 * @param {Object} componentOpt.version the component version
 * @param {Object} componentOpt.viewId the view id
 * @param {Object} componentOpt.session the session for the current request
 * @param {Object} componentOpt.[request] the current request object; this parameter is missing when the component is retrieved via web sockets
 * @param {Function} callback receives the error and data as parameter
 */
DataLayer.prototype.loadData = function (componentOpt, callback) {
    var err = null,
        self = this;

    if (!componentOpt) {
        callback(new RainError("Missing componentOptions in function loadData()."));
        return;
    }

    if (!componentOpt.id) {
        callback(new RainError("Missing component id in function loadData()."));
        return;
    }

    if (!componentOpt.viewId) {
        callback(new RainError("Missing view id in function loadData()."));
        return;
    }

    if (!componentOpt.version) {
        callback(new RainError("Missing version in function loadData()."));
        return;
    }

    if (!callback) {
        throw new RainError("Missing callback in function loadData().");
    }

    /**
     * LOAD DATA
     *
     * 1. get server-side-controller of component template from componentContainer
     * 2. require data.js from componentId/server/data.js
     * 3. check that function is declared for the view
     * 4. call it with parameter if necessary
     * 5. invoke callback with these parameters
     */

    /*
     * 1. get server-side-controller
     */
    var component = componentRegistry.getConfig(componentOpt.id, componentOpt.version);
    if (!component) {
        err = new RainError('Component %s-%s doesn\'t exist.',
                            [componentOpt.id, componentOpt.version]);
        callback(err);
        return;
    }

    if (!component.views[componentOpt.viewId]) {
        err = new RainError('View %s doesn\'t exists in meta.json.', [componentOpt.viewId]);
        callback(err);
        return;
    }

    /*
     * 2. require data.js
     */
    var absoluteDataPath = path.join(component.folder, this.dataPath);

    path.exists(absoluteDataPath, function (exists, err) {
        if (!exists) {
            // commented cause it is not an error
            callback(null, componentOpt.context);
            return;
        }

        var data = requireWithContext(absoluteDataPath, Translation.get().generateContext(component));

        /*
         * 3. check a function is declared for the view
         */
        if (typeof data[componentOpt.viewId] !== 'function') {
            callback(null, componentOpt.context);
            return;
        }
        /*
         * 4. call it
         */

        process.nextTick(function () {
            try {
                data[componentOpt.viewId](environment, function (err, context) {
                    /*
                     * call callback with the customData
                     */
                    callback(err, context);
                }, componentOpt.context, self._createCustomRequest(componentOpt));
            } catch (exception) {
                callback(new RainError('Error in data.js: %s/%s/%s',
                                       [componentOpt.id, componentOpt.version, componentOpt.viewId],
                                       exception));
            }
        });

    });
};

/**
 * Creates a custom request object containing the session, query params, request headers and the URL.
 * When the component is requested via web sockets it contains only the session. The type property
 * indicates the transport used to render the components (HTTP or web sockets).
 *
 * @param {Object} opt the options object passed to the loadData function
 * @returns {Object} the custom request object
 */
DataLayer.prototype._createCustomRequest = function (opt) {
    var req = {};
    req.session = opt.session;

    if (opt.request) { //HTTP
        req.query = opt.request.query;
        req.headers = opt.request.headers;
        req.url = opt.request.url;
        req.type = 'HTTP';
    } else { //web sockets
        req.type = 'WebSocket';
    }

    return req;
};

module.exports = new DataLayer();

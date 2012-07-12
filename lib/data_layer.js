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
    fs = require('fs'),
    componentRegistry = require('./component_registry'),
    Translation = require('./translation');

/**
 * The data layer allows developers to pass custom data to the view templates. When the template is
 * executed it can use this data to construct dynamic markup. The data can be obtained by calling a
 * web service or it can be constructed inside the data layer function.
 *
 * -----
 * Usage
 * -----
 *
 * The Handlebars context in which the component helper was used is passed to the data layer method
 * in the ``context`` parameter. If the ``data.js`` file or the method for the view doesn't exist, this
 * data will become the context used to execute the template associated with the aggregated component.
 *
 * Data layer methods are placed in the ``/server/data.js`` file. In order to define a data
 * method for a view a function with the same name as the *view id* should be created in this file and
 * exported as part of the public API of this module.
 *
 * This method receives four parameters:
 *  - ``environment`` contains information about the RAIN environment;
 *  - ``callback`` represents a function that should be called after the custom data is constructed. It
 *    accepts two parameters: an error (or ``null`` if no error occurred) and the custom data;
 *  - ``context`` contains the Handlebars context in which the component was aggregated and the
 *    options that were passed to the component helper;
 *  - ``request`` has five properties:
 *      - ``session``: the session for the current request;
 *      - ``query``: the query parameters for the current page;
 *      - ``headers``: the request headers;
 *      - ``url``: the URL of the current page;
 *      - ``type``: HTTP or WebSocket. When the component is requested via web sockets
 *        only ``session`` and ``type`` are available.
 *
 * ``/meta.json``
 *
 * .. code-block:: javascript
 *
 *     {
 *         "id": "button",
 *         "version": "1.0",
 *         "views": {
 *             "index" : {
 *                 "view": "index.html",
 *                 "controller": {
 *                     "client": "index.js",
 *                     "server": "index.js"
 *                 }
 *             },
 *             "index1" : {
 *                 "view": "index1.html",
 *                 "controller": {
 *                     "client": "index1.js",
 *                     "server": "index1.js"
 *                 }
 *             }
 *         }
 *     }
 *
 * ``/server/data.js``
 *
 * .. code-block:: javascript
 *
 *     function index(environment, callback, context, request) {
 *         var customData = {
 *             field1: data,
 *             field2: 'value'
 *         };
 *
 *         callback(null, customData);
 *     }
 *
 *     function index1(environment, callback, context, request) {
 *         getData(data, function (customData) {
 *             callback(null, customData);
 *         });
 *     }
 *
 *     module.exports = {
 *         index: index,
 *         index1: index1
 *     };
 *
 * .. seealso::
 *
 *     :js:class:`Environment`
 *         Environment API
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
 * @param {Object} componentOpt.context the current Handlebars context
 * @param {Object} componentOpt.session the session for the current request
 * @param {Object} componentOpt.[request] the current request object; this parameter is missing when the component is retrieved via web sockets
 * @param {Function} callback receives the error and data as parameter
 */
DataLayer.prototype.loadData = function (componentOpt, callback) {
    var err = null,
        self = this;

    if (!callback) {
        throw new RainError("Missing callback in function loadData().");
    }

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

    fs.exists(absoluteDataPath, function (exists, err) {
        if (!exists) {
            // commented cause it is not an error
            callback(null, componentOpt.context);
            return;
        }

        var data = requireWithContext(absoluteDataPath,
                        Translation.get().generateContext(component,
                                                          componentOpt.environment.language));
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
                data[componentOpt.viewId](componentOpt.environment, function (err, context) {
                    /*
                     * call callback with the customData
                     */
                    callback(err, context);
                }, componentOpt.context, self._createCustomRequest(componentOpt));
            } catch (exception) {
                console.log(exception);
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

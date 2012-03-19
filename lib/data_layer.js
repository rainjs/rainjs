"use strict";

var path = require('path');
var componentRegistry = require('./component_registry');
var environment = require('./environment');

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
 * to receive custom data. If the data returns, it calls the callback function.
 *
 * @param {Object} componentOpt the component information
 * @param {Object} componentOpt.id the component id
 * @param {Object} componentOpt.version the component version
 * @param {Object} componentOpt.viewId the view id
 * @param {Function} callback receives the error and data as parameter
 */
DataLayer.prototype.loadData = function (componentOpt, callback) {
    var err = null;

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

        var data = require(absoluteDataPath);

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
                }, componentOpt.context);
            } catch (exception) {
                callback(new RainError('Error in data.js: %s/%s/%s',
                                       [componentOpt.id, componentOpt.version, componentOpt.viewId],
                                       exception));
            }
        });

    });
};

module.exports = new DataLayer();

"use strict";

var path = require('path');
var server = require('./server');

function LayerData() {
    this.dataPath = 'server/data.js';

    this.init();
};

/**
 * Validates all necessary parameters and invokes the data function from the component to receive custom data. If the
 * data returns, it calls the callback function
 *
 * @param {Object} componentOpt
 * @param {Object} componentOpt.id Component id
 * @param {Object} componentOpt.version Component version
 * @param {Object} componentOpt.viewId View id
 * @param {Function} callback Receives the error and data as parameter
 */
LayerData.prototype.loadData = function(componentOpt, version, callback) {
    var err = null;

    if (!componentOpt) {
        throw "Missing componentOptions in function loadData()";
    }

    if (!componentOpt.id) {
        throw "Missing component id in function loadData()";
    }

    if (!componentOpt.viewId) {
        throw "Missing view id in function loadData()";
    }

    if (!componentOpt.version) {
        throw "Missing version in function loadData()";
    }

    if (!callback) {
        throw "Missing callback in function loadData()";
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
    var component = server.componentRegistry.getComponent(componentOpt.id, componentOpt.version);
    if (!component) {
        err = 'Component: ' + componentOpt.id + '-' + componentOpt.version + " doesn't exist";
        callback(err);
        return;
    }

    if (!component.views[componentOpt.viewId]) {
        err = 'View: ' + componentOpt.viewId + " doesn't exists in meta.json";
        callback(err);
        return;
    }

    /*
     * 2. require data.js
     */
    var absoluteDataPath = path.join(server.config.componentPath, componentOpt.componentOpt.id, this.dataPath);

    var exists = true;
    path.exists(absoluteDataPath, function(exists, err) {
        if (!exists) {
            // commented cause it is not an error
            // err = 'Data.js (file): ' + absoluteDataPath + " doesn't exist";
            callback(err);
            return;
        }

        var data = require(absoluteDataPath);

        /*
         * 3. check a function is declared for the view
         */
        if (data[componentOpt.viewId] == undefined) {
            callback(err);
            return;
        }
        /*
         * 4. call it
         */
        data[componentOpt.viewId](function(err, customData) {
            /*
             * call callback with the customData
             */
            callback(err, customData);
        }, componentOpt.data);
    });
};

module.exports = new LayerData();

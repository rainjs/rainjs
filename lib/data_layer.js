"use strict";

var path = require('path');

function LayerData() {
    this.dataPath = 'server/data.js';

    this.initilize();
};

LayerData.prototype.initilize = function(){

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
LayerData.prototype.loadData = function(componentOpt, callback) {
    var componentRegistry = require('./component_registry');
    var err = null;

    if (!componentOpt) {
        callback(new RainError("Missing componentOptions in function loadData()"));
    }

    if (!componentOpt.id) {
        callback(new RainError("Missing component id in function loadData()"));
    }

    if (!componentOpt.viewId) {
        callback(new RainError("Missing view id in function loadData()"));
    }

    if (!componentOpt.version) {
        callback(new RainError("Missing version in function loadData()"));
    }

    if (!callback) {
        callback(new RainError("Missing callback in function loadData()"));
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
        err = new RainError('Component: ' + componentOpt.id + '-' + componentOpt.version + " doesn't exist");
        callback(err);
        return;
    }

    if (!component.views[componentOpt.viewId]) {
        err = new RainError('View: ' + componentOpt.viewId + " doesn't exists in meta.json");
        callback(err);
        return;
    }

    /*
     * 2. require data.js
     */
    var absoluteDataPath = path.join(component.folder, this.dataPath);

    var exists = true;
    path.exists(absoluteDataPath, function(exists, err) {
        if (!exists) {
            // commented cause it is not an error
            callback(new RainError('data.js (file): ' + absoluteDataPath + " doesn't exist"));
            return;
        }

        var data = require(absoluteDataPath);

        /*
         * 3. check a function is declared for the view
         */
        if (data[componentOpt.viewId] == undefined) {
            callback(new RainError('No function declared for the view: ' + componentOpt.viewId));
            return;
        }
        /*
         * 4. call it
         */
        try{
            data[componentOpt.viewId](function(err, customData) {
                /*
                 * call callback with the customData
                 */
                callback(err, customData);
            }, componentOpt.data);
        } catch(exception){
            callback(new RainError('Error in data.js: '+componentOpt.id+'/'+componentOpt.version+'/' + componentOpt.viewId, exception));
        }
    });
};

module.exports = new LayerData();

"use strict";

var path    = require('path'),
    sys     = require('sys'),
    events  = require('events'),
    http    = require('http');

function LayerData(componentContainer, componentPath){
    events.EventEmitter.call(this);

    this.__componentContainer = componentContainer;
    this.__componentPath = componentPath;
    this.init();
};

//inherit from EventEmitter
sys.inherits(LayerData, events.EventEmitter);

LayerData.prototype.init = function(){

};


/**
 * @param {Object} componentMap
 * @param {Function} callback function which receives the error and data as parameter
 */
LayerData.prototype.loadData = function(componentMap, callback){
    var err  = null;

    if(!componentMap){
        throw "Missing componentMap in function loadData()";
    }

    if(!callback){
        throw "Missing callback in function loadData()";
    }

    /**
     * @TODO
     * LOAD DATA
     *
     * 1. get server-side-controller of component template from componentContainer
     * 2. invoke getTemplateData() with params if nessacary
     * 3. invoke getTranslationData()
     * 4. fill templateData and error if there is an error
     * 5. invoke callback with these parameters
     */

    /*
     * 1. get server-side-controller
     */
    var component = this.__componentContainer.componentMap[componentMap.componentId + ';' + componentMap.version];
    if(!component){
        err = 'Component: '+componentMap.componentId + ';' + componentMap.version + " doesn't exist";
        callback(err);
        return;
    }

    if(!component.views[componentMap.viewid] && component.views[componentMap.viewid]['serverside-controller']){
        err = 'Controller: '+ componentMap.viewid + " doesn't exists in meta.json";
        callback(err);
        return;
    }
    var controller = component.views[componentMap.viewid]['serverside-controller'];

    var controllerPath = path.join(this.__componentPath, componentMap.componentId, 'controller', controller);

    var exists = true;
    path.exists(controllerPath, function (exists, err) {
        if (!exists) {
            err = 'Controller (file): '+ controllerPath + " doesn't exist";
            callback(err);
            return;
        }

        controller = require(controllerPath);

        /*
         * 2. invoke getTemplateData()
         */

        controller.getTemplateData(function(err, data){

            /*
             * 4. fill with templateData
             *
             * data
             */

            /*
             * 5. invoke callback with error and data
             */
            callback(err, data);
        }, componentMap.data);
    });
};


module.exports = new LayerData();

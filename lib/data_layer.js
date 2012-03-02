"use strict";

var path    = require('path');
var sys     = require('sys');
var events  = require('events');
var server  = require('./server');


function LayerData(){
    events.EventEmitter.call(this);

    this.init();
};

//inherit from EventEmitter
sys.inherits(LayerData, events.EventEmitter);

LayerData.prototype.init = function(){

};


/**
 * @param {Object} componentOpt
 * @param {Function} callback function which receives the error and data as parameter
 */
LayerData.prototype.loadData = function(componentOpt, version, callback){
    var err  = null;

    if(!componentOpt){
        throw "Missing componentOptions in function loadData()";
    }

    if(!componentOpt.id){
        throw "Missing component id in function loadData()";
    }

    if(!componentOpt.viewid){
        throw "Missing view id in function loadData()";
    }

    if(!componentOpt.version){
        throw "Missing version in function loadData()";
    }

    if(!callback){
        throw "Missing callback in function loadData()";
    }

    /**
     * @TODO
     * LOAD DATA
     *
     * 1. get server-side-controller of component template from componentContainer
     * 2. invoke getTemplateData() with parameter if necessary
     * 3. invoke getTranslationData()
     * 4. fill templateData and error if there is an error
     * 5. invoke callback with these parameters
     */

    /*
     * 1. get server-side-controller
     */
    var component = server.componentRegistry.getComponent(componentOpt.id, componentOpt.version);
    if(!component){
        err = 'Component: '+componentOpt.id + '-' + componentOpt.version + " doesn't exist";
        callback(err);
        return;
    }

    if(!component.views[componentOpt.viewid] && component.views[componentOpt.viewid]['serverside-controller']){
        err = 'Controller: '+ componentOpt.viewid + " doesn't exists in meta.json";
        callback(err);
        return;
    }
    var controller = component.views[componentOpt.viewid]['serverside-controller'];

    var controllerPath = path.join(server.config.componentPath, componentOpt.componentOpt.id, 'controller', controller);

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
        }, componentOpt.data);
    });
};


module.exports = new LayerData();

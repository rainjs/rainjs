"use strict";

var Handlebars = require('handlebars');
var config = require('./configuration');
var componentRegistry = require('./component_registry');
var fs = require('fs');


function Renderer() {
    this.bootstrapTemplate = null;
    this.initialize();
};

Renderer.prototype.initialize = function() {

};

Renderer.prototype.renderBootstrap = function(mainComponent, viewId, request, response){
    var initData = {
        name: mainComponent.id,
        version: mainComponent.version,
        viewId: viewId,
        data: {
            query: request.query,
            body: request.body
        },
        rain: this.createRainContext({
            component: mainComponent,
            res: response
        })
    };
    
    var core = componentRegistry.getComponent('core', componentRegistry.getLatestVersion('core'));
    
    return core.views['bootstrap'].compiledTemplate(initData);
};

Renderer.prototype.renderComponent = function(opt){
    var component = opt.component;
    var viewId = opt.viewId;
    var version = component.version;
    var data = opt.data || {};
    var view = component.views[viewId];
    if(!view){
        throw {
            message: "Can't render component! View: " + viewId + " doesn't exists!",
            type: "Renderer"
        };
    }
    
    //build rain context
    var parentRainContext = data.rain();    
    //extend data with rainContext
    data.rain = this.createRainContext({
        component: component,
        res: parentRainContext.res
    });
    
    var controller = view.controller && view.controller.client ? view.controller.client : null;
    if(controller){
        controller = component.id + '/' + version + '/js/' + controller;
    }
    
    var html = view.compiledTemplate(data);
    var rainContext = data.rain();
    
    return {
        css: rainContext.css,
        html: html,
        controller: controller,
        moduleId: component.id+'-'+component.version
    };
};

Renderer.prototype.createRainContext = function(opt){
    var rainContext = {
        component: opt.component,
        css: [],
        res: opt.res
    };
    return function(){
        return rainContext;
    };
};

module.exports = new Renderer();

"use strict";

var Handlebars = require('handlebars');
var config = require('./configuration');
var fs = require('fs');


function Renderer() {
    this.bootstrapTemplate = null;
    this.initialize();
};

Renderer.prototype.initialize = function() {
    var html = fs.readFileSync(config.server.componentPath + '/core/client/bootstrap.html').toString();
    this.bootstrapTemplate = Handlebars.compile(html);
};


Renderer.prototype.render = function(opt){
    var component = opt.component;
    var viewid = opt.viewid;
    var version = opt.version;
    var data = opt.data || {};
    var view = component.views[viewid];
    if(!view){
        throw {
            message: "Can't render component! View: " + viewid + " doesn't exists!",
            type: "Renderer"
        };
    }
    
    //build rain context
    var rainContext = {
        component: component,
        css: []
    };
    //extend data with rainContext
    data.rain = function () {
        return rainContext;
    };
    
    var controller = (view.controller && view.controller.client) || null;
    if(controller){
        controller = component.id + '/' + (version ? version+'/' : '') + 'js/' + controller;
    }
    
    return {
        css: rainContext.css,
        html: view.compiledTemplate(data),
        controller: controller,
        domId: 200,
        instanceId : 'joker',
        staticId: 'batman',
        moduleId: 'error-1.0'
    };
};

module.exports = new Renderer();

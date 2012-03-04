"use strict";

var path = require('path');
var fs = require('fs');
var mime = require('mime');
var Handlebars = require('handlebars');

/**
 * Precompiling of templates and css / less files for faster usage.
 * 
 * @param {Object} componentConfig the meta.json information as reference
 */
function configure(componentConfig) {
    var config = require('../configuration');
    /**
     * precompiling of templates
     */
    var templateFolder = path.join(config.server.componentPath, componentConfig.folder, 'client');
    
    var files;

    try {
        files = fs.readdirSync(templateFolder);
    } catch (ex) {
        throw {message: 'The template folder doesn\'t exist!', type: 'io'};
    }
    
    for (var i = 0, len = files.length; i < len; i++) {
        var file = files[i];
        var templatePath = path.join(templateFolder, file);
        
        var stat = fs.statSync(templatePath);
        if (stat.isDirectory()) {
            continue;
        }
        var type = mime.lookup(templatePath);
        if(type == "text/html"){
            var view = getView(componentConfig, file);
            if(!view){
                console.info("Template", file, "is not related to any view");
                continue;
            }
            try {
                var content = fs.readFileSync(templatePath).toString();
                view.compiledTemplate = Handlebars.compile(content);
            } catch (ex) {
                throw { message: 'Failed to precompile template ' + file + ' !', type: 'io' };
            }
        }
    }
}

/**
 * Returns the view related to the template filename
 * 
 * @param {Object} componentConfig componentConfig of the component
 * @param filename template filename
 * @returns {Object} the view
 * @private
 */
function getView(componentConfig, filename) {
    var views = componentConfig.views;
    for(var view in views){
        if(views[view].view == filename){
            return views[view];
        }
    }
}

module.exports = {
    name: "Precompiler Plugin",
    configure: configure
};

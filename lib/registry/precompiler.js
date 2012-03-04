"use strict";

var path = require('path');
var fs = require('fs');
var mime = require('mime');
var Handlebars = require('handlebars');
var less = require('less');

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
    
    readFolderRecursive(templateFolder, function(filePath, filename){
        var type = mime.lookup(filePath);
        if(type == "text/html"){
            var view = getView(componentConfig, filename);
            if(!view){
                console.info("Template", filename, "is not related to any view");
                return;
            }
            try {
                var content = fs.readFileSync(filePath).toString();
                view.compiledTemplate = Handlebars.compile(content);
            } catch (ex) {
                throw { message: 'Failed to precompile template ' + filename + ' !', type: 'io' };
            }
        }
    });
    
    /**
     * precompiling of css / less
     */
    var cssFolder = path.join(config.server.componentPath, componentConfig.folder, 'client', 'css');
    var compiledCSS = componentConfig.compiledCSS = {};
    
    readFolderRecursive(cssFolder, function(filePath, filename) {
        var type = mime.lookup(filePath);
        if(type == "text/css"){
            try {
                var content = fs.readFileSync(filePath).toString();
                less.render(content, function (error, css) {
                    if (error) {
                      throw {
                          message: 'CSS parsing error at precommpiling! '+filePath
                      };
                    } else {
                      compiledCSS[filename] = css;
                    }
                });
            } catch (ex) {
                throw { message: 'Failed to precompile template ' + filename + ' !', type: 'io' };
            }
        }
    });
}

/**
 * Reads a folder recursive and calls the callback to to something with a file
 * 
 * @param {String} folder folder which has to be loaded
 * @param {Function} callback callback
 */
function readFolderRecursive(folder, callback) {
    var files = [];
    try {
        files = fs.readdirSync(folder);
    } catch (ex) {
        console.info('The folder', folder, 'doesn\'t exist!');
    }
    
    for (var i = 0, len = files.length; i < len; i++) {
        var file = files[i];
        var filePath = path.join(folder, file);
        
        var stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            readFolderRecursive(filePath, callback);
        } else {
            callback(filePath, file);
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

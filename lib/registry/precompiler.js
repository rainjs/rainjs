"use strict";

var path = require('path');
var fs = require('fs');
var mime = require('mime');
var Handlebars = require('handlebars');
var less = require('less');
var util = require('../util');

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

    util.walkDir(templateFolder, function(filePath, filename){
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

    util.walkDir(cssFolder, function(filePath, filename) {
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
                        var stat = fs.statSync(filePath);
                        compiledCSS[filename] = {
                            content: css,
                            lastModified: stat.mtime
                        };
                    }
                });
            } catch (ex) {
                throw { message: 'Failed to precompile template ' + filename + ' !', type: 'io' };
            }
        }
    });
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

"use strict";

var mod_path = require('path'),
    mod_fs = require("fs"),
    logger = require('./logger.js').getLogger(mod_path.basename(module.filename)),
    Handlebars = require('handlebars');


/**
 * Setup handlebars with all configurations
 */
function setup(){
    autoDiscoverPlugins();
}


/**
 * Register automatically all custom Helpers inside the folder RAIN/lib/handlebars 
 */
function autoDiscoverPlugins(){
    var dir = mod_fs.readdirSync(__dirname + '/handlebars');
    
    dir.forEach(function (file) {
        try {
            var customHelper = require(mod_path.join(__dirname, 'handlebars', file));
            Handlebars.registerHelper(customHelper.name, customHelper.helper);
            logger.info("Loaded handlebars helper: "+customHelper.name);
        } catch(ex){
            logger.error(ex);
        }
    });
}

module.exports = {
    setup: setup
};

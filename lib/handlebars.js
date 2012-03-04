"use strict";

var mod_path = require('path');
var mod_fs = require("fs");
var Handlebars = require('handlebars');

/**
 * Setup handlebars with all configurations.
 */
function setup() {
    autoDiscoverPlugins();
}

/**
 * Register automatically all custom helpers inside the folder RAIN/lib/handlebars.
 */
function autoDiscoverPlugins() {
    var dir = mod_fs.readdirSync(__dirname + '/handlebars');

    dir.forEach(function (file) {
        try {
            var customHelper = require(mod_path.join(__dirname, 'handlebars', file));
            Handlebars.registerHelper(customHelper.name, customHelper.helper);

            console.log("Loaded handlebars helper: " + customHelper.name);
        } catch(ex){
            console.error(ex);
            throw { message: "Can't load handlebars helper: "+file, type: "handlebars" };
        }
    });
}

setup();

module.exports = Handlebars;

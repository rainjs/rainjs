"use strict";

var path = require('path');
var fs = require("fs");
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
    var dir = fs.readdirSync(__dirname + '/handlebars');

    dir.forEach(function (file) {
        try {
            var customHelper = require(path.join(__dirname, 'handlebars', file));
            Handlebars.registerHelper(customHelper.name, customHelper.helper);

            console.log("Loaded handlebars helper: " + customHelper.name);
        } catch(ex) {
            throw new RainError("Can't load handlebars helper: "+file, ex, RainError.ERROR_IO);
        }
    });
}

setup();

module.exports = Handlebars;

"use strict";

var path = require('path');
var fs = require('fs');

/**
 * Precompiles the templates and css / less files for faster usage.
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
        console.log(templateFolder);
        files = fs.readdirSync(templateFolder);
    } catch (ex) {
        throw {message: 'The template folder doesn\'t exist!', type: 'io'};
    }
    
    for (var i = 0, len = files.length; i < len; i++) {
        var file = files[i];
        var templatePath = path.join(templateFolder, file);
        
        var stat = fs.statSync(componentPath);
        if (stat.isDirectory()) {
            continue;
        }
        console.log(stat);

//        try {
//            var metaFile = path.join(componentPath, ComponentRegistry.COMPONENT_METAFILE);
//            var config = JSON.parse(fs.readFileSync(metaFile, 'utf8'));           
//            registerComponent(self, config, file);
//        } catch (ex) {
//            console.log('Failed to load meta.json for ' + file + ' component!');
//        }
    }
}

module.exports = {
    name: "Precompiler Plugin",
    configure: configure
};

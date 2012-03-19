"use strict";

var path = require('path');
var fs = require('fs');
var Handlebars = require('../handlebars');

/**
 * Precompiles the templates associated with a component.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(componentConfig) {
    if (!componentConfig.views) {
        return;
    }

    var templatesFolder = componentConfig.paths('templates', true);
    for (var viewId in componentConfig.views) {
        var viewObj = componentConfig.views[viewId];
        viewObj.view = viewObj.view || (viewId + '.html');
        var filePath = path.join(templatesFolder, viewObj.view);
        try {
            var content = fs.readFileSync(filePath).toString();
            viewObj.compiledTemplate = Handlebars.compile(content);
        } catch (ex) {
            delete componentConfig.views[viewId];
            console.log('Failed to precompile template %s!', [filePath]);
        }
    }
}

module.exports = {
    name: "Precompile Templates Plugin",
    configure: configure
};

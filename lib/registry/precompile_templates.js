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
        var filePath = path.join(templatesFolder, viewObj.view);
        try {
            var content = fs.readFileSync(filePath).toString();
            viewObj.compiledTemplate = Handlebars.compile(content);
        } catch (ex) {
            throw new RainError('Failed to precompile template ' + filePath + ' !', RainError.ERR_IO);
        }
    }
}

module.exports = {
    name: "Precompile Templates Plugin",
    configure: configure
};

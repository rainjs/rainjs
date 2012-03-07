"use strict";

var path = require('path');
var fs = require('fs');

/**
 * Rewrites the client controller to an abasolute path.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(componentConfig) {
    if (!componentConfig.views) {
        return;
    }

    for ( var viewId in componentConfig.views) {
        var viewObj = componentConfig.views[viewId];
        var fullControllerPath = viewObj.controller && viewObj.controller.client ? viewObj.controller.client : null;
        if (fullControllerPath) {
            fullControllerPath = '/' + componentConfig.id + '/' + componentConfig + '/js/' + fullControllerPath;
            viewObj.controller = fullControllerPath;
        }
    }
}

module.exports = {
    name: "Controller Path Plugin",
    configure: configure
};

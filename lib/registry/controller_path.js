"use strict";

var path = require('path');
var fs = require('fs');

/**
 * Rewrites the client controller to an absolute path.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(componentConfig) {
    if (!componentConfig.views) {
        return;
    }

    for (var viewId in componentConfig.views) {
        var viewObj = componentConfig.views[viewId];
        var fullControllerPath = (viewObj.controller && viewObj.controller.client) ?
                                  viewObj.controller.client : null;

        //check if default controller exists
        if(!fullControllerPath){
            try {
                fs.readFileSync(path.resolve(componentConfig.folder, 'client/js', viewId+'.js'));
                fullControllerPath = viewId+'.js';
                if(!viewObj.controller){
                    viewObj.controller = { client: null };
                } else {
                    viewObj.controller.client = null;
                }
            } catch(e) {
                //view has no controller
            }
        }
        if (fullControllerPath) {
            fullControllerPath = '/' + componentConfig.id + '/' +
                                 componentConfig.version + '/js/' + fullControllerPath;
            viewObj.controller.client = fullControllerPath;
        }
    }
}

module.exports = {
    name: "Controller Path Plugin",
    configure: configure
};

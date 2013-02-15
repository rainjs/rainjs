// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";

var path = require('path');
var fs = require('fs');
var logger = require('../logging').get();

/**
 * Rewrites the client controller to an absolute path.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(componentConfig) {
    if (!componentConfig.views) {
        logger.error('There are no views for the component ' + componentConf.folder);
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
                logger.info('The ' + componentConfig.folder + "'s view " + viewId + ' has no controller');
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

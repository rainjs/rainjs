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

var configuration = require('../configuration');

/**
 * Handles the requests that are matching the view route. If the component/view requested
 * needs authentication and the user is not loged in than it will automatically redirect
 * to the login component from the configuration file.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function handle(request, response) {
    var renderer = require('../renderer'),
        component = request.component,
        viewId = request.path || "index",
        redirectLogin = false;

    var loginComponentId = configuration.loginComponent ? configuration.loginComponent.id :
            configuration.errorComponent.id,
        loginVersion = configuration.loginComponent ? configuration.loginComponent.version :
            configuration.errorComponent.version,
        loginViewId = configuration.loginComponent ? configuration.loginComponent.viewId :
            '401';


    if(!request.user._isAuthenticated) {
        if (component.dynamicConditions && component.dynamicConditions._component) {
            redirectLogin = true;
        }

        // Add view dynamic conditions.
        if (component.dynamicConditions && component.dynamicConditions[viewId]) {
            redirectLogin = true;
        }

        if(component.permissions && component.permissions.length > 0) {
            redirectLogin = true;
        }

        if(component.views[viewId].permissions &&
            component.views[viewId].permissions.length > 0) {
            redirectLogin = true;
        }
    }

    if(redirectLogin) {
        response.writeHead(302, {
            'Location': '/' + loginComponentId + '/' + loginVersion + '/' + loginViewId
        });
        response.end();
        return;
    }

    response.setHeader('Content-Type', 'text/html; charset=UTF-8');
    response.setHeader('Cache-Control', 'no-cache, must-revalidate');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Expires', new Date(Date.now() - 1000 * 60 * 60).toUTCString());

    response.write(renderer.renderBootstrap(component, viewId, request, response));
}

module.exports = {
    name: "View Route",
    route: /^\/([\w-]+)\/?(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(.*)$/,
    handle: handle
};

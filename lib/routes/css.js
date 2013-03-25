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

var path = require('path'),
    utils = require('connect/lib/utils'),
    less = require('less'),
    componentRegistry = require('../component_registry'),
    routerUtils = require('../router_utils'),
    Buffer = require('buffer').Buffer;

/**
 * Handles the requests for CSS files. If cross referencing, the cached less is compiled with the scope.
 * and served to the client, otherwise the server serves the already cached css.
 *
 * @param {Request} req the request object
 * @param {Response} res the response object
 */
function handle(req, res) {
    if (routerUtils.refuseNonGetRequests(req, res)) {
        return;
    }

    var component = req.component,
        resource = req.path,
        compiledCSS = component.compiledCSS && component.compiledCSS[resource],
        maxAge = 10; //seconds

    if (!compiledCSS) {
        routerUtils.handleNotFound(req, res);
        return;
    }

    var scopeComponentId = undefined,
        scopeComponentVersion = undefined;

    if (req.query) {
        scopeComponentId = req.query.component;
        scopeComponentVersion = req.query.version;
        if (scopeComponentId) {
            scopeComponentVersion = componentRegistry.getLatestVersion(scopeComponentId,
                                                                       scopeComponentVersion);
            if (!scopeComponentVersion) {
                routerUtils.handleNotFound(req, res);
                return;
            }
        }
    }

    if(scopeComponentId) {
        var scope = '.' + scopeComponentId + '_' + (scopeComponentVersion.replace(/[\.]/g, '_'));
        less.render(scope + ' { ' + compiledCSS.unscopedCSS + ' }', function (error, css) {
            if (error) {
                var err = new RainError('CSS parsing error', RainError.ERROR_HTTP, 500);
                routerUtils.handleError(err, req, res);
            } else {
               sendResponse(req, res, maxAge, css, compiledCSS);
            }
        });
    } else {
        sendResponse(req, res, maxAge, compiledCSS.content, compiledCSS);
    }
}

/**
 * Sends the response with the css to the client.
 *
 * @param {HTTP request} req the request from the client
 * @param {HTTP response} res the HTTP response for the client request
 * @param {Integer} maxAge
 * @param {String} css the content of the css after compile and scope
 * @param {Object} compiledCSS cached object of component's CSS
 */
function sendResponse(req, res, maxAge, css, compiledCSS) {
    var opts = routerUtils.setResourceHeaders(req, res, maxAge, compiledCSS.lastModified,
        'text/css; charset=UTF-8', Buffer.byteLength(css, 'utf8'));

    if (opts.sendBody) {
        if (opts.start && opts.end) {
            var buf = new Buffer(css, 'utf8');
            res.end(buf.toString('utf8', opts.start, opts.end + 1));
        } else {
            res.end(css);
        }
    }
}

module.exports = {
    name: "CSS Route",
    route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:css)\/(.+)/,
    handle: handle
};

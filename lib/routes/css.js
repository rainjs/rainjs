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
var utils = require('connect/lib/utils');
var less = require('less');
var componentRegistry = require('../component_registry');
var routerUtils = require('../router_utils');
var Buffer = require('buffer').Buffer;

/**
 * Handles the requests for CSS files.
 *
 * @param {Request} req the request object
 * @param {Response} res the response object
 */
function handle(req, res) {
    if (routerUtils.refuseNonGetRequests(req, res)) {
        return;
    }

    var maxAge = 10; //seconds
    var component = req.component;
    var resource = req.path;
    var compiledCSS = component.compiledCSS && component.compiledCSS[resource];

    if (!compiledCSS) {
        routerUtils.handleNotFound(req, res);
        return;
    }

    var scopeComponentId = undefined;
    var scopeComponentVersion = undefined;

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

    scopeComponentId = scopeComponentId || component.id;
    scopeComponentVersion = scopeComponentVersion || component.version;

    var scope = '.' + scopeComponentId + '_' + (scopeComponentVersion.replace(/[\.]/g, '_'));
    less.render(scope + ' { ' + compiledCSS.content + ' }', function (error, css) {
        if (error) {
            var err = new RainError('CSS parsing error', RainError.ERROR_HTTP, 500);
            routerUtils.handleError(err, req, res);
        } else {
            var opts = routerUtils.setResourceHeaders(req, res, maxAge, compiledCSS.lastModified,
                'text/css; charset=UTF-8', Buffer.byteLength(css, 'utf8'));
            if (opts.sendBody) {
                if (opts.start && opts.end) {
                    var buf = new Buffer(css, 'utf8');
                    res.end(buf.toString('utf8', opts.start, opts.end));
                } else {
                    res.end(css);
                }
            }
        }
    });
}

module.exports = {
    name: "CSS Route",
    route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:css)\/(.+)/,
    handle: handle
};

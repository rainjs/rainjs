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

var routerUtils = require('../router_utils'),
    translation = require('../translation'),
    Buffer = require('buffer').Buffer;

/**
 * Handles the requests for locale files.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function handle(request, response) {
    var lastModified = translation.get().lastModified,
        maxAge = 604800; // seconds

    var language = request.path;
    if (!language) {
        routerUtils.handleNotFound(request, response);
        return;
    }

    var content = JSON.stringify(translation.get().getLocales(request.component, language));

    var opts = routerUtils.setResourceHeaders(request, response, maxAge, lastModified,
               'application/json; charset=UTF-8', Buffer.byteLength(content, 'utf8'));
    if (opts.sendBody) {
        if (opts.start !== undefined && opts.end !== undefined) {
            var buf = new Buffer(content, 'utf8');
            response.end(buf.toString('utf8', opts.start, opts.end + 1));
        } else {
            response.end(content);
        }
    }
}

module.exports = {
    name: "Locale Route",
    route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?locale(?:\/([\w-]+))(?:\/)?$/,
    handle: handle
};

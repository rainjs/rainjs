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
    var maxAge = 604800; // seconds
    var lastModified = translation.get().lastModified;

    var content = JSON.stringify(translation.get().getLocales(request.component));

    var opts = routerUtils.setResourceHeaders(request, response, maxAge, lastModified,
               'application/json; charset=UTF-8', Buffer.byteLength(content, 'utf8'));
    if (opts.sendBody) {
        if (opts.start !== undefined && opts.end !== undefined) {
            var buf = new Buffer(content, 'utf8');
            response.end(buf.toString('utf8', opts.start, opts.end));
        } else {
            response.end(content);
        }
    }
}

module.exports = {
    name: "Locale Route",
    route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?locale/,
    handle: handle
};

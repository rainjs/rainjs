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
                'text/css; charset=UTF8', Buffer.byteLength(css, 'utf8'));
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

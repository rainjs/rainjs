"use strict";

var path = require('path');
var utils = require('connect/lib/utils');
var less = require('less');
var componentRegistry = require('../component_registry');
var connectUtils = require('connect/lib/utils');
var routerUtils = require('../router_utils');

/**
 * Handles the requests for CSS files.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Array} matches the route matches
 */
function handler(request, response, matches) {
    var componentId = matches[1];
    var componentVersion = matches[2];
    var cssPath = matches[3];

    // Get latest version if no version is given.
    if (!componentVersion) {
        componentVersion = componentRegistry.getLatestVersion(componentId);
    }

    var component = componentRegistry.getConfig(componentId, componentVersion);
    if (!component || !component.compiledCSS || !component.compiledCSS[cssPath]) {
        respondNotFound(request, response);
        return;
    }

    var scopeComponentId = undefined;
    var scopeComponentVersion = undefined;

    if (request.query) {
        scopeComponentId = request.query.component;
        scopeComponentVersion = request.query.version;
        if (scopeComponentId) {
            scopeComponentVersion = componentRegistry.getLatestVersion(scopeComponentId,
                                                                       scopeComponentVersion);
            if (!scopeComponentVersion) {
                respondNotFound(response);
                return;
            }
        }
    }
    scopeComponentId = scopeComponentId || componentId;
    scopeComponentVersion = scopeComponentVersion || componentVersion;

    var compiledCSS = component.compiledCSS[cssPath];

    var head = 'HEAD' == request.method;

    // Header fields.
    if (!response.getHeader('Date')) {
        response.setHeader('Date', new Date().toUTCString());
    }

    if (!response.getHeader('Cache-Control')) {
        response.setHeader('Cache-Control', 'public, max-age=10');
    }

    if (!response.getHeader('Last-Modified')) {
        response.setHeader('Last-Modified', compiledCSS.lastModified.toUTCString());
    }

    if (!response.getHeader('ETag')) {
        response.setHeader('ETag', utils.etag({
            size: compiledCSS.content.length,
            mtime: compiledCSS.lastModified
        }));
    }

    if (!response.getHeader('content-type')) {
        response.setHeader('Content-Type', 'text/css; charset=UTF8');
    }

    // Conditional GET support.
    if (utils.conditionalGET(request)) {
        if (!utils.modified(request, response)) {
            request.emit('static');
            return utils.notModified(response);
        }
    }

    // transfer
    if (head) {
        return response.end();
    }

    var scope = '.' + scopeComponentId + '_' + (scopeComponentVersion.replace(/[\.]/g, '_'));
    less.render(scope + ' { ' + compiledCSS.content + ' }', function (error, css) {
        if (error) {
          var err = new RainError('CSS parsing error for ' + connectUtils.escape(request.originalUrl), 
              RainError.ERROR_HTTP, 500);
          routerUtils.handleError(err, request, response);
        } else {
          response.setHeader('Content-Length', css.length);
          response.end(css);
        }
    });
}

/**
 * The css file wasn't found. Set 404 status code.
 *
 * @param {Response} response the response
 */
function respondNotFound(request, response) {
    var error = new RainError(connectUtils.escape(request.originalUrl) + ' was not found!', RainError.ERROR_HTTP, 404);
    routerUtils.handleError(error, request, response);
}

module.exports = {
    name: "CSS Route",
    route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:css)\/(.+)/,
    handler: handler
};

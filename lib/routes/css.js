"use strict";

var path = require('path');
var utils = require('connect/lib/utils');
var less = require('less');
var componentRegistry = require('../component_registry');

/**
 * Handles the requests for CSS files.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Array} matches the route matches
 * @param {Route} next the next route handler
 */
function handler(request, response, matches, next) {
    var componentId = matches[1];
    var componentVersion = matches[2];
    var cssPath = matches[3];

    // Get latest version if no version is given.
    if (!componentVersion) {
        componentVersion = componentRegistry.getLatestVersion(componentId);
    }

    var component = componentRegistry.getConfig(componentId, componentVersion);
    if (!component || !component.compiledCSS || !component.compiledCSS[cssPath]) {
        respondNotFound(response);
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
    if (request.method == 'HEAD') {
        return response.end();
    }

    var scope = '.' + scopeComponentId + '_' + (scopeComponentVersion.replace(/[\.]/g, '_'));
    less.render(scope + ' { ' + compiledCSS.content + ' }', function (error, css) {
        if (error) {
          throw new RainError('CSS parsing error!', error);
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
function respondNotFound(response) {
    response.statusCode = 404;
    response.end();
}

module.exports = {
    name: "CSS Route",
    route: /^\/(\w+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:css)\/(.+)/,
    handler: handler,
    hasSession: false,
    hasQuery: true
};

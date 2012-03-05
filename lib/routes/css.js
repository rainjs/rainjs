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

    var crossComponentId = undefined;
    var crossComponentVersion = undefined;

    if (request.query) {
        crossComponentId = request.query.component;
        crossComponentVersion = request.query.version;
        if (crossComponentId) {
            crossComponentVersion = componentRegistry.getLatestVersion(crossComponentId,
                                                                       crossComponentVersion);
            if (!crossComponentVersion) {
                respondNotFound(response);
                return;
            }
        }
    }
    crossComponentId = crossComponentId || componentId;
    crossComponentVersion = crossComponentVersion || componentVersion;

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

    if (crossComponentId && crossComponentVersion) {
        var scope = '.' + crossComponentId + '_' + (crossComponentVersion.replace(/[\.]/g, '_'));
        less.render(scope + ' { ' + compiledCSS.content + ' }', function (error, css) {
            if (error) {
              throw {
                  message: 'CSS parsing error!'
              };
            } else {
              response.setHeader('Content-Length', css);
              response.end(css);
            }
        });
    }
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

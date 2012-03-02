"use strict";

var path = require('path');
var utils = require('connect/lib/utils');
var less = require('less');

/**
 * Handles the requests for CSS files.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Array} matches the route matches
 * @param {Route} next the next route handler
 */
function handler(request, response, matches, next) {
    var server = require('../server');

    var componentId = matches[1];
    var componentVersion = matches[2];
    var cssPath = matches[3];

    var crossComponentId = undefined;
    var crossComponentVersion = undefined;

    if (request.query) {
        crossComponentId = request.query.component;
        crossComponentVersion = request.query.version;
        if (crossComponentId) {
            var crossComponent = server.componentRegistry
                                       .getComponent(crossComponentId, crossComponentVersion);
            if (!crossComponent) {
                respondNotFound(response);
                return;
            }
        }
    }

    var component = server.componentRegistry.getComponent(componentId, componentVersion);
    if (!component || !component.compiledCSS || !component.compiledCSS[cssPath]) {
        respondNotFound(response);
        return;
    }

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

    var content = compiledCSS.content;
    if (crossComponentId && crossComponentVersion) {
        var scope = '.' + crossComponentId + '_' + (crossComponentVersion.replace(/[\.]/g, '_'));
        less.render(scope + ' { ' + content + ' }', function (error, css) {
            if (error) {
              throw {
                  message: 'CSS parsing error!'
              }
            } else {
              content = css;
            }
        });
    }

    response.setHeader('Content-Length', content.length);
    response.end(content);
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
    route: /(\w+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:css)\/(.+)/,
    handler: handler
};

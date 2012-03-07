"use strict";

var path = require('path');
var connectUtils = require('connect/lib/utils');
var fs = require('fs');
var routerUtils = require('../router_utils');

/**
 * Handles the requests for JS files.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Array} matches the route matches
 */
function handler(request, response, matches) {
    var componentRegistry = require('../component_registry');

    var componentId = matches[1];
    var version = matches[2];
    var jsPath = matches[3];

    //get latest version if no version is given
    if(typeof version === 'undefined'){
        version = componentRegistry.getLatestVersion(componentId);
    }

    var component = componentRegistry.getConfig(componentId, version);
    if (!component) {
        respondNotFound(request, response);
        return;
    }

    var resourcePath = path.join(componentRegistry.getFolder(componentId, version, "js", true), jsPath);

    var maxAge = 604800000; //1 Week
    var head = 'HEAD' == request.method;

    fs.stat(resourcePath, function(err, stat) {
        // ignore ENOENT
        if (err) {
            //return 'ENOENT' == err.code ? next() : next(err);
            respondNotFound(request, response);
            return;
        }

        // header fields
        if (!response.getHeader('Date')) {
            response.setHeader('Date', new Date().toUTCString());
        }
        if (!response.getHeader('Cache-Control')) {
            response.setHeader('Cache-Control', 'public, max-age=' + (maxAge / 1000));
        }
        if (!response.getHeader('Last-Modified')) {
            response.setHeader('Last-Modified', stat.mtime.toUTCString());
        }
        if (!response.getHeader('ETag')) {
            response.setHeader('ETag', connectUtils.etag(stat));
        }
        if (!response.getHeader('content-type')) {
            response.setHeader('content-type', 'text/javascript; charset=UTF-8');
        }

        // conditional GET support
        if (connectUtils.conditionalGET(request)) {
            if (!connectUtils.modified(request, response)) {
                request.emit('static');
                return connectUtils.notModified(response);
            }
        }

        response.setHeader('Content-Length', stat.size);

        // transfer
        if (head) {
            return response.end();
        }

        // stream
        var stream = fs.createReadStream(resourcePath);
        request.emit('static', stream);
        stream.pipe(response);
        stream.on('error', function(err){
            if (res.headerSent) {
                console.error(err.stack);
                req.destroy();
            } else {
                respondNotFound(request, response);
            }
        });
    });
}

/**
 * If component doesn't exist
 *
 * @param {Response} response the response
 */
function respondNotFound(request, response) {
    var error = new RainError(connectUtils.escape(request.originalUrl) + ' was not found!', RainError.ERROR_HTTP, 404);
    routerUtils.handleError(error, request, response);
}

module.exports = {
    name: "Javascript Route",
    route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:js)\/(.+)/,
    handler: handler
};

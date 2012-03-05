"use strict";

var path = require('path');
var connectUtils = require('connect/lib/utils');
var fs = require('fs');

/**
 * Handles the requests for JS files.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Array} matches the route matches
 * @param {Route} next the next route handler
 */
function handler(request, response, matches, next) {
    var server = require('../server');
    var componentRegistry = server.componentRegistry;

    var componentId = matches[1];
    var version = matches[2];
    var jsPath = matches[3];
    
    //get latest version if no version is given
    if(version == undefined){
        version = componentRegistry.getLatestVersion(componentId);
    }

    var component = server.componentRegistry.getConfig(componentId, version);
    if (!component) {
        respondNotFound(response);
    }
    
    var resourcePath = path.join(server.config.server.componentPath, component.folder, 'client/js', jsPath);

    var maxAge = 604800000; //1 Woche
    var head = 'HEAD' == request.method;
    
    fs.stat(resourcePath, function(err, stat) {
        // ignore ENOENT
        if (err) {
            return 'ENOENT' == err.code ? next() : next(err);
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
    });
}

/**
 * If component doesn't exist
 *
 * @param {Response} response the response
 */
function respondNotFound(response) {
    response.statusCode = 404;
    response.end();
}

module.exports = {
    name: "Javascript Route",
    route: /^\/(\w+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:js)\/(.+)/,
    handler: handler,
    hasSession: false
};

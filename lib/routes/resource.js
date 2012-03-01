"use strict";

var url = require('url');
var path = require('path');
var fs = require('fs');
var mime = require('mime');
var connectUtils = require('connect/lib/utils');

/**
 * The request handler
 *
 * @param request the request object
 * @param response the response object
 */
function handler(request, response, matches, next) {

    var server = require('../server');

    var componentName = matches[1];
    var version = matches[2];
    var filepath = matches[3];

    //TODO: add versioning
    var resourcePath = path.join(server.config.server.componentPath, componentName, 'htdocs', filepath);

    var maxAge = 10000
    , ranges = request.headers.range
    , head = 'HEAD' == request.method
    , redirect = false
    , fn = null;

    console.log(resourcePath);

    fs.stat(resourcePath, function(err, stat) {
        // mime type
        var type = mime.lookup(resourcePath);

        // ignore ENOENT
        if (err) {
            if (fn) {
                return fn(err);
            }
            return 'ENOENT' == err.code ? next() : next(err);
            // redirect directory in case index.html is present
        } else if (stat.isDirectory()) {
            if (!redirect) {
                return next();
            }
            response.statusCode = 301;
            response.setHeader('Location', url.pathname + '/');
            response.end('Redirecting to ' + url.pathname + '/');
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
            var charset = mime.charsets.lookup(type);
            response.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
        }
        response.setHeader('Accept-Ranges', 'bytes');

        // conditional GET support
        if (connectUtils.conditionalGET(request)) {
            if (!connectUtils.modified(request, response)) {
                request.emit('static');
                return connectUtils.notModified(response);
            }
        }

        var opts = {};
        var chunkSize = stat.size;

        // we have a Range request
        if (ranges) {
            ranges = connectUtils.parseRange(stat.size, ranges);
            // valid
            if (ranges) {
                // TODO: stream options
                // TODO: multiple support
                opts.start = ranges[0].start;
                opts.end = ranges[0].end;
                chunkSize = opts.end - opts.start + 1;
                response.statusCode = 206;
                response.setHeader('Content-Range', 'bytes ' + opts.start + '-' + opts.end + '/' + stat.size);
                // invalid
            } else {
                return fn ? fn(new Error('Requested Range Not Satisfiable')) : invalidRange(res);
            }
        }

        response.setHeader('Content-Length', chunkSize);

        // transfer
        if (head) {
            return response.end();
        }

        // stream
        var stream = fs.createReadStream(resourcePath, opts);
        request.emit('static', stream);
        stream.pipe(response);
    });
}

module.exports = {
    name: "Resource Route",
    route: /\/(\w+)\/(\d\.?\d?\.?\d?)\/(?:resources)\/(.+)/,
    handler: handler
};
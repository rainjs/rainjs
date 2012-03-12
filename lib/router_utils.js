"use strict";

var connectUtils = require('connect/lib/utils');
var path = require('path');
var mime = require('mime');
var fs = require('fs');

/**
 * Utility method to send an error message in case of an error. 
 * 
 * @param {Error} err the error object
 * @param {Request} req the request object
 * @param {Response} res the response object
 */
function handleError(err, req, res) {
    var errorHandler = require('./error_handler');
    var renderer = require('./renderer');
    var status = err.code || 500;
    var accept = req.headers.accept || '';

    console.log('Failed to ' + req.method + ' ' + connectUtils.escape(req.originalUrl));
    console.log(err.stack);

    if (status < 400) {
        status = 500;
    }

    if (!res.headerSent) {
        res.statusCode = status;

        if (accept.indexOf('text/html') !== -1) {
            res.setHeader('Content-Type', 'text/html');
            var conf = errorHandler.getErrorComponent(status);
            if (conf) {
                res.write(renderer.renderBootstrap(conf.component, conf.view, req, res));
            } else {
                res.end();
            }
        } else {
            res.setHeader('Content-Type', 'text/plain');
            res.end();
        }
    } else {
        req.destroy();
    }
}

/**
 * The resource wasn't found. Set 404 status code.
 *
 * @param {Request} req the request object
 * @param {Response} res the response object
 */
function handleNotFound(req, res) {
    var error = new RainError('The specified URL was not found!', RainError.ERROR_HTTP, 404);
    handleError(error, req, res);
}

/**
 * Checks if a path contains '../'. This is done to prevent users to access files in the parent directory.
 * 
 * @param {String} pathname the path to check
 */
function isValid(pathname) {
    try {
        pathname = decodeURI(pathname);
    } catch (ex) {
        return false;
    }

    return pathname.indexOf('../') === -1;
}

/**
 * Sets the headers for a resource request.
 * 
 * @param {Request} req the request object
 * @param {Response} res the response object
 * @param {Number} maxAge the max time to cache the resource in seconds
 * @param {Date} lastModified the time at which the resource was modified
 * @param {String} contentType the content type of the resource
 * @param {Number} len the length of the resource in bytes
 */
function setResourceHeaders(req, res, maxAge, lastModified, contentType, len) {
    var opts = {sendBody: true};
    var ranges = req.headers.range;   

    setHeader(res, 'Date', new Date().toUTCString());
    setHeader(res, 'Cache-Control', maxAge);
    setHeader(res, 'Last-Modified', lastModified.toUTCString());
    setHeader(res, 'Content-Type', contentType);
    setHeader(res, 'Accept-Ranges', 'bytes');
    setHeader(res, 'ETag', connectUtils.etag({
        size: len,
        mtime: lastModified
    }));

    // conditional GET support
    if (connectUtils.conditionalGET(req)) {
        if (!connectUtils.modified(req, res)) {
            connectUtils.notModified(res);
            opts.sendBody = false;
            return opts;
        }
    }

    // we have a Range request
    if (ranges) {
        ranges = connectUtils.parseRange(len, ranges);

        // valid
        if (ranges) {
            opts.start = ranges[0].start;
            opts.end = ranges[0].end;

            // unsatisfiable range
            if (opts.start > len - 1) {
                res.setHeader('Content-Range', 'bytes */' + stat.size);
                var err = new RainError('The specified range is invalid', RainError.ERROR_HTTP, 416);
                routerUtils.handleError(err, request, response);
                opts.sendBody = false;
                return opts;
            }

            // limit last-byte-pos to current length
            if (opts.end > len - 1) {
                opts.end = len - 1;
            }

            // Content-Range
            len = opts.end - opts.start + 1;
            res.statusCode = 206;
            res.setHeader('Content-Range', 'bytes ' + opts.start + '-' + opts.end + '/' + stat.size);
        }
    }

    res.setHeader('Content-Length', len); 

    // transfer
    if (req.method === 'HEAD') {
        res.end();
        opts.sendBody = false;
        return opts;
    }

    return opts;
}

/**
 * A utility method for setting headers. It first checks if the key exists.
 * 
 * @param {Response} the response object
 * @param {String} key the header key to set
 * @param {String} value the value for the header 
 */
function setHeader(res, key, value) {
    if (!res.getHeader(key)) {
        res.setHeader(key, value);
    }
}

/**
 * Displays an error if the request method id not GET or HEAD
 * 
 * @param {Request} req the request object
 * @param {Response} res the response object
 * @returns {Boolean} true if the method isn't GET or HEAD
 */
function refuseNonGetRequests(req, res) {
    var get = 'GET' === req.method,
        head = 'HEAD' === req.method;

    // ignore non-GET and non-HEAD requests
    if (!get && !head) {
        var err = new RainError('Only GET and HEAD are supported for resources', 
            RainError.ERROR_HTTP, 405);
        handleError(err, req, res);
        return true;
    }

    return false;
}

/**
 * Checks that a path is in the root folder and doesn't contain hidden files
 * 
 * @param {String} root the root path in which the file should be located
 * @param {String} resource the full path of the resource
 * @returns {Boolean} true if the path is valid
 */
function checkPath(root, resource) {
    if (resource.indexOf(root) !== 0) {
        return false;
    }

    var basename;
    while ((basename = path.basename(resource)) !== '') {

        if (basename.indexOf('.') === 0) {
            return false;
        }
        resource = path.dirname(resource);
    }

    return true;
}

/**
 * Handles a static resource request
 * @param {Request} req the request object
 * @param {Response} res the response object
 * @param {Number} maxAge the max time to cache the resource in seconds
 * @param {String} type the type of the resource. It is used to obtain the path of the resource
 */
function handleStaticResource(req, res, maxAge, type) {
    if (refuseNonGetRequests(req, res)) {
        return;
    }

    var component = req.component;
    var resource = req.path;

    var root = component.paths(type, true);
    resource = path.normalize(path.join(root, resource)); 

    if (!checkPath(root, resource)) {
        handleNotFound(req, res);
        return;
    }

    fs.stat(resource, function (err, stat) {
        if (err || stat.isDirectory()) {
            handleNotFound(req, res);
            return;
        }

        var type = mime.lookup(resource);
        var charset = mime.charsets.lookup(type);
        var contentType = type + (charset ? '; charset=' + charset : '');

        var opts = setResourceHeaders(req, res, maxAge, stat.mtime, contentType, stat.size);

        if (opts.sendBody) {
            // stream
            var stream = fs.createReadStream(resource, opts);
            req.on('close', stream.destroy.bind(stream));
            stream.pipe(res);
            stream.on('error', function (err) {
                handleNotFound(req, res);
            });
        }
    });
}

module.exports = {
    handleError: handleError,
    handleNotFound: handleNotFound,
    isValid: isValid,
    setResourceHeaders: setResourceHeaders,
    refuseNonGetRequests: refuseNonGetRequests,
    checkPath: checkPath,
    handleStaticResource: handleStaticResource
};

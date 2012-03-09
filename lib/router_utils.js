"use strict";

var connectUtils = require('connect/lib/utils');
var path = require('path');
var registry = require('./component_registry'); 
var mime = require('mime');
var fs = require('fs');

/**
 * Utility method to send a error message in case of an error. 
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
    
    if(!res.headerSent){
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

function isValid(pathname) {
    try {
        pathname = decodeURI(pathname);
    } catch (ex) {
        return false;
    }
    
    return pathname.indexOf('../') === -1;
}

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

function setHeader(res, key, value) {
    if (!res.getHeader(key)) {
        res.setHeader(key, value);
    }
}

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
 * 
 * @param {Number} maxAge the time for which to cache the resource in seconds
 */
function handleStaticResource(req, res, maxAge, type) {
    if (refuseNonGetRequests(req, res)) {
        return;
    }
    
    var component = req.component;
    var resource = req.path;

    var root = registry.getFolder(component.id, component.version, type, true);
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
            stream.on('error', function(err){                
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
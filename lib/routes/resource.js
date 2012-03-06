"use strict";

var url = require('url');
var path = require('path');
var fs = require('fs');
var mime = require('mime');
var utils = require('connect/lib/utils');

/**
 * Handles static resource requests.
 *
 * @param req the request object
 * @param res the response object
 */
function handle(req, res, matches, next) {
    var registry = require('../component_registry'),
        config = require('../configuration');

    var get = 'GET' === req.method,
        head = 'HEAD' === req.method;

    // ignore non-GET and non-HEAD requests
    if (!get && !head) {
        return next();
    }

    var component = matches[1],
        version,
        resource;

    version = matches[2] || registry.getLatestVersion(component);
    resource = matches[3];

    // ignore not found components or versions
    if ('undefined' === typeof version) {
        return next();
    }

    root = registry.getFolder(component, version, 'resources', true);
    resource = path.normalize(path.join(root, resource));

    var maxAge = 10000,
        ranges = req.headers.range;

    fs.stat(resource, function (err, stat) {
        if (err) {
            return ('ENOENT' === err.code || 'ENAMETOOLONG'=== err.code)
                ? next()
                : next(err);
        } else if (stat.isDirectory()) {
            return next();
        }

        var type = mime.lookup(resource);

        // header fields
        if (!res.getHeader('Date')) {
            res.setHeader('Date', new Date().toUTCString());
        }
        if (!res.getHeader('Cache-Control')) {
            res.setHeader('Cache-Control', 'public, max-age=' + (maxAge / 1000));
        }
        if (!res.getHeader('Last-Modified')) {
            res.setHeader('Last-Modified', stat.mtime.toUTCString());
        }
        if (!res.getHeader('Content-Type')) {
          var charset = mime.charsets.lookup(type);
          res.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
        }

        res.setHeader('Accept-Ranges', 'bytes');

        // conditional GET support
        if (utils.conditionalGET(req)) {
            if (!utils.modified(req, res)) {
                req.emit('static');
                return utils.notModified(res);
            }
        }

        var opts = {},
            len = stat.size;

        // we have a Range request
        if (ranges) {
            ranges = utils.parseRange(len, ranges);

            // valid
            if (ranges) {
                opts.start = ranges[0].start;
                opts.end = ranges[0].end;

                // unsatisfiable range
                if (opts.start > len - 1) {
                    res.setHeader('Content-Range', 'bytes */' + stat.size);
                    return next(utils.error(416));
                }

                // limit last-byte-pos to current length
                if (opts.end > len - 1) {
                    opts.end= len - 1;
                }

                // Content-Range
                len = opts.end - opts.start + 1;
                res.statusCode = 206;
                res.setHeader('Content-Range', 'bytes '
                    + opts.start
                    + '-'
                    + opts.end
                    + '/'
                    + stat.size);
            }
        }

        res.setHeader('Content-Length', len);

        // transfer
        if (head) return res.end();

        // stream
        var stream = fs.createReadStream(resource, opts);
        req.emit('static', stream);
        req.on('close', stream.destroy.bind(stream));
        stream.pipe(res);

        stream.on('error', function(err){
            if (res.headerSent) {
                console.error(err.stack);
                req.destroy();
            } else {
                next(err);
            }
        });
    });
}

module.exports = {
    name: "Resource Route",
    route: /^\/([\w-]+)\/(?:((?:\d\.)?\d\.\d)\/)?resources\/(.+)/,
    handler: handle
};

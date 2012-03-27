"use strict";

var renderer = require('../renderer'),
    util = require('util'),
    url = require('url'),
    qs = require('querystring'),
    path = require('path');

function helper(src, localized) {
    // parsed url object
    var u;
    // url.parse may throw errors
    try { u = url.parse(src); }
    catch (e) { return ''; }

    // if src is external, leave it as it is
    if (typeof u.protocol !== 'undefined') {
        return src;
    }

    if (0 !== u.pathname.indexOf('/')) {
        var c = renderer.rain.component;

        u.pathname = path.join('/', c.id, c.version, 'resources', u.pathname);
        u.path = u.pathname + (u.search ? u.search : '');
    }

    if (localized === true) {
        var q = qs.parse(u.query);
        if (!q.loc) {
            q.loc = 1;
            u.query = qs.stringify(q);
            u.search = '?' + u.query;
            u.path = u.pathname + u.search;
        }
    }

    return url.format(u);
}

module.exports = {
    name: 'url',
    helper: helper
};

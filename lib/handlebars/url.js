"use strict";

var util = require('util'),
    url = require('url'),
    qs = require('querystring'),
    path = require('path');

/**
 * @name URLHelper
 * @class
 */
function URLHelper() {}

/**
 * URL handlebars helper.
 *
 * Tries to interpret the given URL as a resource URL: relative paths
 * are converted to resource routes for the current component and
 * absolute and external paths are left as is.
 *
 * For relative and absolute paths, the second accepted parameter
 * identifies a localized resource by adding a 'loc' query parameter to the URL.
 *
 * @example
 *
 *   Getting an image from the component's resource folder (note that the
 *   URL value inside the helper needs to be surrounded by double quotes):
 *   <img src="{{url "images/img.jpg"}}">
 *
 *   Getting a localized image from the component's resource folder:
 *   <img src="{{url "images/img.jpg" true}}">
 *
 *   Getting an image from another component, following the normal resource route
 *   (the localized parameter can also be specified here if needed):
 *   <img src="{{url "/other/resources/images/img.jpg"}}">
 *
 *   Getting an external image:
 *   <img src="{{url "http://www.example.com/img.jpg"}}">
 *
 *   Other uses:
 *   <div style="background: url('{{url "images/background.jpg"}}') repeat-x 0 0;"></div>
 *
 * @param {String} src the resource path
 * @param {Boolean} localized true to request a localized resource
 */
URLHelper.helper = function (src, localized) {
    var renderer = require('../renderer');

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

        u.pathname = ['/', c.id, '/', c.version, '/resources', '/', u.pathname].join('');
        u.path = u.pathname + (u.search ? u.search : '');
    }

    if (localized === true) {
        var q = qs.parse(u.query);
        if (!q.hasOwnProperty('loc')) {
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
    helper: URLHelper.helper
};

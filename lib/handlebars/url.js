"use strict";

var util = require('util'),
    url = require('url'),
    qs = require('querystring'),
    path = require('path'),
    registry = require('../component_registry');

/**
 * @name URLHelper
 * @class
 */
function URLHelper() {}

/**
 * URL handlebars helper.
 *
 * Tries to interpret the given URL as a resource URL. It supports
 * accessing the current component or other components.
 *
 * It supports localized paths by specifying a "localized" boolean parameter.
 *
 * @example
 *
 *   Getting an image from the component's resource folder:
 *   <img src="{{url path="images/img.jpg"}}">
 *
 *   Getting a localized image from the component's resource folder:
 *   <img src="{{url path="images/img.jpg" localized=true}}">
 *
 *   Getting an image from another component
 *   (the localized parameter can also be specified here if needed):
 *   <img src="{{url name="other" version="1.0" path="images/img.jpg"}}">
 *
 *   Getting an external image:
 *   <img src="{{url path="http://www.example.com/img.jpg"}}">
 *
 *   Other uses:
 *   <div style="background: url('{{url path="images/background.jpg"}}') repeat-x 0 0;"></div>
 *
 * @param {Object} options the helper parameters and arguments
 * @param {Object} options.hash the helper key-value pairs
 * @param {String} [options.hash.name] the name of the component
 * @param {String} [options.hash.version] the component's version
 * @param {String} options.hash.path the path relative to the component's resources folder
 * @param {Boolean} [options.hash.localized] true to specify that the resource should be localized
 */
URLHelper.helper = function (options) {
    var renderer = require('../renderer'),
        // parsed url object
        u,
        src = options.hash.path,
        localized = options.hash.localized;

    if ('string' !== typeof src) {
        return '';
    }

    src = encodeURI(src);
    u = url.parse(src);

    // if src is external, leave it as it is
    if (typeof u.protocol !== 'undefined') {
        return src;
    }

    if (0 === u.pathname.indexOf('/')) {
        u.pathname = u.pathname.substring(1);
    }

    var c = renderer.rain.component,
        name,
        version;

    if (options.hash.name) {
        name = options.hash.name;
        version = registry.getLatestVersion(name, options.hash.version);
    } else {
        name = c.id;
        version = c.version;
    }

    u.pathname = ['/', name, '/', version, '/resources', '/', u.pathname].join('');
    u.path = u.pathname + (u.search ? u.search : '');

    if (localized) {
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

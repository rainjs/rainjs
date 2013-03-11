// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";

var util = require('util'),
    url = require('url'),
    registry = require('../component_registry');

/**
 * @name URLHelper
 * @constructor
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
        parsedUrl,
        path = options.hash.path,
        localized = options.hash.localized,
        locale = renderer.rain.environment.language;

    if (typeof path !== 'string') {
        return '';
    }

    path = encodeURI(path);
    parsedUrl = url.parse(path);

    // if the path is external, leave it as it is
    if (typeof parsedUrl.protocol !== 'undefined') {
        return path;
    }

    if (parsedUrl.pathname.indexOf('/') === 0) {
        parsedUrl.pathname = parsedUrl.pathname.substring(1);
    }

    var component = renderer.rain.component,
        name,
        version;

    if (options.hash.name) {
        name = options.hash.name;
        version = registry.getLatestVersion(name, options.hash.version);
    } else {
        name = component.id;
        version = component.version;
    }

    parsedUrl.pathname = util.format('/%s/%s%s/resources/%s', name, version,
            localized ? '/' + locale : '', parsedUrl.pathname);
    parsedUrl.path = parsedUrl.pathname + (parsedUrl.search ? parsedUrl.search : '');

    return url.format(parsedUrl);
};

module.exports = {
    name: 'url',
    helper: URLHelper.helper
};

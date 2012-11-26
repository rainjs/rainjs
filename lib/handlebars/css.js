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

var componentRegistry = require('../component_registry'),
    renderer = require('../renderer'),
    logger = require('../logging').get();

/**
 * This Handlebars helper collects the css dependencies of a view and provides it to the renderer.
 * The helper has support for CSS media queries.
 *
 * Syntax::
 *
 *      {{css path="cssPath" [name="componentId" [version="versionNumber"] [media="query"]]}}
 *
 * @example
 *      Collects the ``index.css`` of the current component.
 *
 *      {{css path="index.css"}}
 *
 * @example
 *      Collects the ``roundDiv.css`` of the component external_theming  with the latest version.
 *
 *      {{css name="external_theming" path="roundDiv.css"}}
 *
 * @example
 *      Uses a media query to specify that the style sheet is usable when the viewport is between 500 and 800 pixels wide.
 *
 *      {{css path="index.css" media="screen and (min-width: 500px) and (max-width: 800px)"}}
 *
 * @name CssHelper
 * @class
 * @constructor
 */
function CssHelper() {
}

/**
 * The helper receives in the context information about the injected css file.
 *
 * To determine the path for the css file, the following steps are performed:
 *
 * 1. if the component key is not specified, the current component id will be used.
 *
 * 2. if the version is not specified and the component key is present, the latest version for the
 *    component at step 1 is found and used.
 *
 * 3. The file has to be located in ``client/css/``.
 *
 * @param {Object} options the css file options
 * @param {String} [options.name] the component id
 * @param {String} [options.version] the component version
 * @param {String} options.path the path to the css file. E.g. index.css
 * @param {String} [options.media] the CSS media query.
 * @throws {RainError} precondition failed when the context has the wrong keys
 * @returns {String} Empty string
 */
CssHelper.prototype.helper = function (options) {
    var componentId = options.hash.name,
        version = options.hash.version,
        path = options.hash.path,
        media = options.hash.media,
        rain = renderer.rain;

    if (!path) {
        throw new RainError('CSS path is missing.', RainError.ERROR_PRECONDITION_FAILED, 'css');
    }

    if (version && !componentId) {
        throw new RainError('The component name is required if you are specifying the version.',
                            RainError.ERROR_PRECONDITION_FAILED, 'name missing');
    }

    var component = rain.component;
    if (!componentId) {
        componentId = component.id;
        version = component.version;
    } else {
        version = componentRegistry.getLatestVersion(componentId, version);
    }

    if (version) {
        path = '/' + componentId + '/' + version + '/css/' + path;
        // set the query string for cross referencing
        if (component.id !== componentId || component.version !== version) {
            path += '?component=' + encodeURIComponent(component.id) +
                    '&version=' + encodeURIComponent(component.version);
        }
    } else {
        // this path doesn't exist, but the user should see an error when a css isn't resolved
        path = '/' + componentId + '/css/' + path;
        logger.error('Component ' + componentId + ' could not be found.');
    }

    var attributes = {
        path: path
    };

    if (media) {
        attributes.media = media;
    }

    attributes.ruleCount = 0;
    var config = componentRegistry.getConfig(componentId, version);

    if (config) {
        var compiledCSS = config.compiledCSS[options.hash.path];
        if (compiledCSS) {
            attributes.ruleCount = compiledCSS.ruleCount;
        }
    }

    rain.css.push(attributes);

    return '';
};

module.exports = {
    name: 'css',
    helper: new CssHelper().helper
};

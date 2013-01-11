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
    Handlebars = require('handlebars'),
    util = require('../util');

/**
 * This Handlebars helper is used to include partial templates.
 *
 * The partial templates for a component are located in the ``client/partials`` folder and are
 * auto-discovered.
 *
 * Syntax:
 *
 *      {{partial path}}
 *
 * @example
 *      <span>
 *          {{partial "fileNameWithoutExtension"}}
 *          {{partial "dir/fileNameWithoutExtension"}}
 *          {{partial variableName}}
 *      </span>
 *
 * @name PartialHelper
 * @constructor
 */
function PartialHelper() {}

/**
 * Renders the partial template.
 * @param {String} path the path of the partial to be rendered
 * @returns {String} the markup generated for the partial helper
 */
PartialHelper.prototype.helper = function (path) {
    var id = renderer.rain.component.id,
        version = renderer.rain.component.version,
        componentConfig = componentRegistry.getConfig(id, version);

    if (typeof componentConfig.partials[path] === 'undefined') {
        logger.error(util.format('The partial %s was not found in %s;%s', path, id, version));
        return '';
    }

    try {
        return new Handlebars.SafeString(componentConfig.partials[path](this));
    } catch (ex) {
        logger.error(
            util.format('Failed to render the partial %s for %s;%s', path, id, version), ex);
        return '';
    }
};

module.exports = {
    name: 'partial',
    helper: new PartialHelper().helper
};

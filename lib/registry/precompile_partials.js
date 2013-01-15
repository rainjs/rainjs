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

var fs = require('fs'),
    Handlebars = require('../handlebars'),
    logger = require('../logging').get(),
    util = require('../util');

/**
 * Precompiles the partial templates associated with a component.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(componentConfig) {
    logger.debug('lib/registry/precompile_partials.js - executing configure for: ' +
        componentConfig.id + ';' + componentConfig.version);

    var partialsFolder = componentConfig.paths('partials', true);
    componentConfig.partials = {};

    util.walkSync(partialsFolder, ['.html'], function (file) {
        try {
            var content = fs.readFileSync(file).toString();

            var key = file.replace(partialsFolder, '');
            // remove the starting '/' or '\' and the '.html' extension
            key = key.substring(1, key.length - 5);
            key.replace('\\', '/');

            // key is in the format dir/name
            componentConfig.partials[key] = Handlebars.compile(content);

            logger.debug('Added partial: ' + key);
        } catch (ex) {
            logger.error('Failed to precompile partial: ' + file, ex);
        }
    });
}

module.exports = {
    name: "Precompile Partials Plugin",
    configure: configure
};

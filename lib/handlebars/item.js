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

var renderer = require('../renderer'),
    Handlebars = require('handlebars'),
    extend = require('node.extend');

/**
 * This Handlebars helper registers items inside a container, and passes them to it where they
 * will get included.
 *
 * @example
 *      {{#container name="box" version="1.0" view="horizontal" rows="2" sid="my-container"}}
 *          {{#item row="0"}}
 *              {{component name="button" view="index" label="Some buton"}}
 *          {{/item}}
 *
 *          {{#item row="1"}}
 *             {{component name="button" view="index" label="Some other button"}}
 *          {{/item}}
 *      {{/container}}
 *
 * @name ItemHelper
 * @class
 * @constructor
 */
function ItemHelper() {}

/**
 * This helper renders its content and then registers it to be included inside the parent container.
 *
 * @param {Object} options the item options
 */
ItemHelper.prototype.helper = function(options) {
    var props = options.hash,
        context = extend({}, this);

    props.content = new Handlebars.SafeString(options.fn(context));

    renderer.rain.items.push(props);
};

module.exports = {
    name: 'item',
    helper: new ItemHelper().helper
};

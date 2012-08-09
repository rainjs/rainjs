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

var componentHelper = require('./component');

/**
 * The **Container** helper is a *block helper* that acts like a container for its content wrapping
 * it in a thin layer that allows it to act as if it is aggregated inside the parent component.
 *
 * Complete syntax::
 *
 *      {{#container view="viewID" [name="componentId" [version="versionNumber"]] [sid="staticId"]}}
 *          {{! Content !}}
 *      {{/container}}
 *
 * Example::
 *
 *      {{#component name="checkbox" view="group"}}
 *          {{#container name="myContainer" view="purple" sid="myPurpleContainer"}}
 *              {{#container name="myContainer" view="blue" sid="myBlueContainer"}}
 *                  {{! this gets aggregated inside the group component but gets rendered inside the containers !}}
 *                  {{component name="checkbox" view="index"}}
 *              {{/container}}
 *          {{/container}}
 *      {{/component}}
 *
 * @name ContainerHelper
 * @constructor
 */
function ContainerHelper() {}

/**
 * The helper decides which view should use and from which container.
 *
 * To determine which container and view to use, the following steps are performed:
 *
 * 1. the view id is required!
 *
 * 2. if the version is specified, the name of the container must be specified too.
 *
 * @param {Object} options the container options
 * @param {String} [options.name] indicates the container from which the content will be aggregated. When this option is missing the current container will be used (the version is always the current version in this case).
 * @param {String} [options.version] the version of the container specified with the previous option. If the version is not specified the latest version will be used. You can also use version fragments as described in the documentation for container versioning. When you specify the version you also need to specify the name of the container, otherwise an error will be thrown.
 * @param {String} options.view the view that will be aggregated.
 * @param {String} [options.sid='undefined'] the container static id, used in the client-side controller
 * @param {Boolean|Number|String|Object|Array} [options.customAttrN] Sets a custom attribute which is extended to the context
 * @throws {Error} when the context has the wrong keys
 * @returns {String} the generated placeholder div with the instance id as id attribute
 */
ContainerHelper.prototype.helper = function (options) {
    return componentHelper.helper.call(this, options, 'container');
};

module.exports = {
    name: 'container',
    helper: new ContainerHelper().helper
};

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

var path = require('path'),
    config = require('../configuration'),
    componentRegistry = require('../component_registry'),
    renderer = require('../renderer'),
    Handlebars = require('handlebars'),
    renderUtil = require('../render_utils'),
    logger = require('../logging').get(),
    extend = require('node.extend');

/**
 * This Handlebars helper aggregates child components into the parent.
 * The helper invokes the renderer to load custom data from the data layer for the template
 * and calls the rendering process after the data is received, to render the component.
 * The aggregated component receives automatically the context of his parent.
 *
 * Complete syntax::
 *
 *      {{component view="viewID" [name="componentId" [version="versionNumber"]] [sid="staticId"] [placeholder=true] [customAttr=value]}}
 *
 * @example
 *      Aggregates the view ``button_green`` from the parent component.
 *
 *      <div class="template">
 *          {{component view="button_green"}}
 *      </div>
 *
 * @example
 *      Aggregates the view ``index`` of the component ``textbox`` with the latest version.
 *
 *      <div class="template">
 *          {{component name="textbox" view="index"}}
 *      </div>
 *
 * @example
 *      Aggregates the view ``index`` of the component ``textbox`` with the latest version and sets the static id ``button1``.
 *
 *      <div class="template">
 *          {{component name="button" view="index" sid="button1"}}
 *      </div>
 *
 * @example
 *      Aggregates the view ``help`` from the parent component but doesn't load the placeholder.
 *
 *      <div class="template">
 *          {{component view="help" placeholder=false}}
 *      </div>
 *
 * @example
 *      Aggregates the view ``help`` from the parent component and extends the context with custom attribute data.
 *
 *      <div class="template">
 *          {{component view="help" label="Hello" value=1}}
 *      </div>
 *
 * @name ComponentHelper
 * @class
 * @constructor
 */
function ComponentHelper() {}

/**
 * The helper decides what view should use and from what component.
 * It sends automatically an error component if something went wrong.
 *
 * To determine what component and view to use, the following steps are performed:
 *
 * 1. the view id is required!
 *
 * 2. if the version is specified, the name of the component must be specified too.
 *
 * @param {Object} options the component options
 * @param {String} [options.name] indicates the component from which the content will be aggregated. When this option is missing the current component will be used (the version is always the current version in this case).
 * @param {String} [options.version] the version of the component specified with the previous option. If the version is not specified the latest version will be used. You can also use version fragments as described in the documentation for component versioning. When you specify the version you also need to specify the name of the component, otherwise an error will be thrown.
 * @param {String} options.view the view that will be aggregated.
 * @param {String} [options.sid='undefined'] the component static id, used in the client-side controller
 * @param {Boolean} [options.placeholder=true] set the placeholder to be rendered or not
 * @param {Boolean|Number|String|Object|Array} [options.customAttrN] Sets a custom attribute which is extended to the context
 * @param {String} [type='component'] the Handlebars helper type (component or container)
 * @throws {Error} when the context has the wrong keys
 * @returns {String} the generated placeholder div with the instance id as id attribute
 */
ComponentHelper.prototype.helper = function (options, type) {
    type = type || 'component';

    // Handlebars sends the current context as this.
    var childComponent = {
        id: options.hash['name'],
        version: options.hash['version'],
        view: options.hash['view'],
        staticId: options.hash['sid'],
        context: createContext(this, options.hash),
        placeholder: options.hash['placeholder'] == undefined ? true : options.hash['placeholder'],
        session: renderer.rain.session,
        request: renderer.rain.request,
        environment: renderer.rain.environment,
        fn: options.fn
    };

    var isValid = renderUtil.isValidView(childComponent, renderer.rain),
        componentConfig = componentRegistry.getConfig(childComponent.id,
                                                      childComponent.version);

    /**
     * check valid view
     */
    if (!isValid) {

    } else if (type == 'container' && componentConfig && componentConfig.type != 'container') {
        renderUtil.replaceWithError(500, childComponent,
                        new RainError('Component "%s is incorrectly used as a container" !',
                        [childComponent.id]));
        componentConfig = componentRegistry.getConfig(childComponent.id,
                                                      childComponent.version);
    } else if (type == 'component' && componentConfig && componentConfig.type == 'container') {
        renderUtil.replaceWithError(500, childComponent,
                        new RainError('Container "%s is incorrectly used as a component" !',
                        [childComponent.id]));
        componentConfig = componentRegistry.getConfig(childComponent.id,
                                                      childComponent.version);
    }

    /**
     * check authorization
     */
    if (!renderUtil.isAuthorized(childComponent, renderUtil.AUTHORIZATION_TYPE_VIEW)) {
        renderUtil.replaceWithError(401, childComponent,
                                  new RainError('Unauthorized access to component "%s" !',
                                                [childComponent.id]));
        componentConfig = componentRegistry.getConfig(childComponent.id,
                                                      childComponent.version);
    }

    return aggregateComponent(this, options, childComponent, componentConfig);
};

/**
 * Aggregates the component with the given data.
 *
 * 1. Creates an instance id
 * 2. Push the component information to the parent component
 * 3. Aggregates the component
 *
 * @param {Object} self the helper context
 * @param {Object} the component / container options
 * @param {Object} childComponent The component information which has to be aggregated
 * @param {Object} componentConfig the component configuration
 * @private
 * @memberOf ComponentHelper#
 */
function aggregateComponent(self, options, childComponent, componentConfig) {
    var rain = renderer.rain,
        parentInstanceId = rain.parentInstanceId;

    var transport = rain.transport;
    transport.renderLevel++;
    var instanceId = renderer.createInstanceId(rain.instanceId,
                                               transport.renderCount++,
                                               childComponent.staticId);

    // Run the container's 'fn' function.
    if (componentConfig.type == 'container' && typeof options.fn === 'function') {
        var fnContext = createContext(self, options.hash);
        rain.parentInstanceId = instanceId;
        var content = new Handlebars.SafeString(options.fn(fnContext));
        delete childComponent.fn;
        rain.parentInstanceId = parentInstanceId;

        childComponent.context.items = rain.items || [];

        if (!childComponent.context.items.length) {
            childComponent.context.html = content;
        } else if (content.string.replace(/\s*/g, '')) {
            logger.warn('The markup inside ' + childComponent.id + '/' +
                    childComponent.version + '/' + childComponent.view +
                    ' rendered inside ' + rain.component.id + '/' + rain.component.version + '/' +
                    rain.component.currentView + ' has been discarded because the container holds items');
        }
    }

    var childInstanceId = {
        id: childComponent.id,
        version: childComponent.version,
        staticId: childComponent.staticId,
        controller: componentConfig.views[childComponent.view].controller &&
                    componentConfig.views[childComponent.view].controller.client,
        instanceId: instanceId,
        placeholder: childComponent.placeholder
    };

    rain.childrenInstanceIds.push(childInstanceId);

    childComponent.parentInstanceId = parentInstanceId;
    childComponent.instanceId = instanceId;

    renderer.loadDataAndSend(childComponent, transport);

    return createPlaceholder(instanceId);
}

/**
 * Creates the placeholder html snippet.
 *
 * @param {String} instanceId The instance id as hash string
 * @private
 * @memberOf ComponentHelper#
 */
function createPlaceholder(instanceId) {
    return new Handlebars.SafeString('<div id="' + instanceId + '"></div>\n');
}

/**
 * Extends the context with the custom attributes in the component helper
 *
 * @param {Object} context Context of the helper
 * @param {Object} attributes Attributes of the helper
 * @private
 * @memberOf ComponentHelper#
 * @returns {Object} Returns an extended context
 */
function createContext(context, attributes) {
    var extendedContext = extend({}, context, attributes);
    //remove component attributes
    delete extendedContext.name;
    delete extendedContext.version;
    delete extendedContext.view;
    delete extendedContext.sid;
    delete extendedContext.placeholder;

    return extendedContext;
}

module.exports = {
    name: 'component',
    helper: new ComponentHelper().helper
};

"use strict";

var path = require('path');
var config = require('../configuration');
var componentRegistry = require('../component_registry');
var renderer = require('../renderer');
var Handlebars = require('handlebars');
var renderUtil = require('../render_utils');
var extend = require('node.extend');

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
 * @throws {Error} when the context has the wrong keys
 * @returns {String} the generated placeholder div with the instance id as id attribute
 */
ComponentHelper.prototype.helper = function (options) {
    // handlebars sends the current context as this
    var childComponent = {
        id: options.hash['name'],
        version: options.hash['version'],
        view: options.hash['view'],
        staticId: options.hash['sid'],
        context: createContext(this, options.hash),
        placeholder: options.hash['placeholder'] == undefined ? true : options.hash['placeholder'],
        session: renderer.rain.session,
        fn: options.fn
    };

    /**
     * check valid view
     */
    if(!renderUtil.isValidView(childComponent, renderer.rain)) {
        return aggregateComponent(childComponent);
    }

    /**
     * check authorization
     */
    if (!renderUtil.isAuthorized(childComponent, renderUtil.AUTHORIZATION_TYPE_VIEW)) {
        renderUtil.replaceWithError(401, childComponent,
                                  new RainError('Unauthorized access to component "%s" !',
                                                [childComponent.id]));
    }

    return aggregateComponent(childComponent);
};

/**
 * Aggregates the component with the given data.
 *
 * 1. Creates an instance id
 * 2. Push the component information to the parent component
 * 3. Aggregates the component
 *
 * @param {Object} childComponent The component information which has to be aggregated
 * @private
 * @memberOf ComponentHelper#
 */
function aggregateComponent(childComponent) {
    var rain = renderer.rain;
    var componentConfig = componentRegistry.getConfig(childComponent.id,
                                                      childComponent.version);
    var transport = rain.transport;
    transport.renderLevel++;
    var instanceId = renderer.createInstanceId(rain.instanceId,
                                               transport.renderCount++,
                                               childComponent.staticId);

    rain.childrenInstanceIds.push({
        id: childComponent.id,
        version: childComponent.version,
        staticId: childComponent.staticId,
        controller: componentConfig.views[childComponent.view].controller &&
                    componentConfig.views[childComponent.view].controller.client,
        instanceId: instanceId,
        placeholder: childComponent.placeholder
    });

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

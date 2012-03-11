"use strict";

var path = require('path');
var authorization = require('../authorization');
var config = require('../configuration');
var componentRegistry = require('../component_registry');
var dataLayer = require('../data_layer');
var renderer = require('../renderer');
var errorHandler = require('../error_handler');
var extend = require('node.extend');
var Handlebars = require('handlebars');

/**
 * This Handlebars helper aggregates child components into the parent.
 * The helper invokes the data layer to collect custom data for the template and calls the
 * renderer after the data is received, to render the component.
 *
 * <pre>
 * Complete syntax:
 *     {{component name="compnentId" version="versionNumber" view="viewID" sid="staticId" data="templateData"}}
 * </pre>
 * @example
 * Aggregates the view ``button_green`` from the parent component.
 * <div class="template">
 *     {{component view="button_green"}}
 * </div>
 * @example
 * Aggregates the view ``index`` of the component ``textbox`` with the latest version.
 * <div class="template">
 *     {{component name="textbox" view="index"}}
 * </div>
 * @example
 * Aggregates the view ``index`` of the component ``textbox`` with the latest version and sets the static id ``button1``.
 * <div class="template">
 *     {{component name="button" view="index" sid="button1"}}
 * </div>
 * @example
 * Aggregates the view ``help`` from the parent component and populates the custom data to the aggregated component.
 * <div class="template">
 *     {{component view="help" data=templateData}}
 * </div>
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
 * @param {String} [options.data='undefined'] the component template data from the parent, used for custom data
 * @throws {Error} when the context has the wrong keys
 * @returns {String} the generated placeholder div with the instance id as id attribute
 */
ComponentHelper.prototype.helper = function (options) {
    var childComponent = {
        componentId : options.hash['name'],
        version : options.hash['version'],
        viewId : options.hash['view'],
        staticId : options.hash['sid'],
        data : options.hash['data']
    };

    var rain = renderer.rain;

    if (!childComponent.viewId) {
        replaceWithError(500, childComponent,
            new RainError('You have to specify a view id with view="VIEWID"!',
                          RainError.ERROR_PRECONDITION_FAILED)
        );
        return aggregateComponent(childComponent);
    }

    if (childComponent.version && !childComponent.componentId) {
        replaceWithError(500, childComponent,
            new RainError('The component name is required if you are specifying the version!',
                          RainError.ERROR_PRECONDITION_FAILED)
        );
        return aggregateComponent(childComponent);
    }

    if (!childComponent.componentId) {
        childComponent.componentId = rain.component.id;
        childComponent.version = rain.component.version;
    } else {
        childComponent.version = componentRegistry.getLatestVersion(childComponent.componentId,
                                                                    childComponent.version);
        if (!childComponent.version) {
            replaceWithError(404, childComponent,
                new RainError('Component %s not found!', [childComponent.componentId])
            );
            return aggregateComponent(childComponent);
        }
    }

    var componentConfig = componentRegistry.getConfig(childComponent.componentId,
                                                      childComponent.version);
    if (!componentConfig.views[childComponent.viewId]){
        replaceWithError(404, childComponent,
             new RainError("The  view %s dosn't exists!", [childComponent.viewId])
        );
        return aggregateComponent(childComponent);
    }

    /**
     * Begin authorization check
     */
    var permissions = [].concat(componentConfig.permissions || [],
                                componentConfig.views[childComponent.viewId].permissions || []);

    var dynamicConditions = [];

    // Add component dynamic conditions.
    if (componentConfig.dynamicConditions && componentConfig.dynamicConditions._component) {
        dynamicConditions.push(componentConfig.dynamicConditions._component);
    }

    // Add view dynamic conditions.
    if (componentConfig.dynamicConditions &&
        componentConfig.dynamicConditions[childComponent.viewId]) {
        dynamicConditions.push(componentConfig.dynamicConditions[childComponent.viewId]);
    }

    var securityContext = createSecurityContext({
        user: rain.session && rain.session.user
    });

    if (!authorization.authorize(securityContext, permissions, dynamicConditions)) {
        replaceWithError(401, childComponent,
             new RainError('Unauthorized access to component "%s" !',
                           [childComponent.componentId]));
        return aggregateComponent(childComponent);
    }

    /**
     * End authorization check
     */

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
    var componentConfig = componentRegistry.getConfig(childComponent.componentId,
                                                      childComponent.version);
    var transport = rain.transport;
    transport.renderLevel++;
    var instanceId = renderer.createInstanceId(rain.instanceId,
                                               transport.renderCount++,
                                               childComponent.staticId);

    rain.childrenInstanceIds.push({
        id: childComponent.componentId,
        version: childComponent.version,
        staticId: childComponent.staticId,
        controller: componentConfig.views[childComponent.viewId].controller &&
                    componentConfig.views[childComponent.viewId].controller.client,
        instanceId: instanceId
    });

    var time = Date.now();
    dataLayer.loadData({
        id: childComponent.componentId,
        viewId: childComponent.viewId,
        version: childComponent.version,
        data: childComponent.data
    }, function(err, templateData) {
        console.debug("Data loading time:", Date.now() - time, 'ms');
        if (err instanceof Error) {
            replaceWithError(500, childComponent, err);
            templateData = childComponent.data;
            componentConfig = componentRegistry.getConfig(childComponent.componentId,
                                                          childComponent.version);
        }
        if (!templateData) {
            templateData = {};
        }
        var renderingTime = Date.now();
        renderer.sendComponent(rain.transport, {
            component: componentConfig,
            viewId: childComponent.viewId,
            staticId: childComponent.staticId,
            instanceId: instanceId,
            data: templateData,
            rain: rain,
            error: err
        });
        console.debug("Rendering time:", Date.now() - renderingTime, 'ms');
        console.debug("Reponse time for the component:", Date.now() - time, 'ms');
    });

    return createPlaceholder(instanceId);
}

/**
 * Creates the placeholder html snippet.
 *
 * @param {String} instanceId The instance id as hash string
 * @private
 * @memberOf ComponentHelper#
 */
function createPlaceholder(instanceId){
    return new Handlebars.SafeString('<div id="' + instanceId + '"></div>\n');
}

/**
 * Replaces the current component with an error component.
 *
 * @param {Number} statusCode Status code of the error
 * @param {Object} component information as a reference
 * @param {RainError} exception The specified error
 * @private
 * @memberOf ComponentHelper#
 */
function replaceWithError(statusCode, childComponent, exception) {
    var error = errorHandler.getErrorComponent(statusCode);
    childComponent.componentId = error.component.id;
    childComponent.version = error.component.version;
    childComponent.viewId = error.view;
    exception.stack = exception.stack.replace(/ /g, '&nbsp;').replace(/\n/g, '<br />');
    childComponent.data = { error: exception };
}

/**
 * Creates the security context and freeze the it after the creation.
 *
 * @param {Object} preferences
 * @returns {securityContext} securityContext
 * @private
 * @memberOf ComponentHelper#
 */
function createSecurityContext(preferences) {
    return {
        user: extend({}, preferences.user)
    };
}

module.exports = {
    name: 'component',
    helper: new ComponentHelper().helper
};

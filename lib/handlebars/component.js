"use strict";

var path = require('path');
var Handlebars = require('handlebars');
var authorization = require('../authorization');
var util = require('../util');
var config = require('../configuration');
var componentRegistry = require('../component_registry');
var dataLayer = require('../data_layer');
var renderer = require('../renderer');
var errorHandler = require('../error_handler');

/**
 * This Handlebars helper transforms a set of parameters into a custom HTML tag. This tag will
 * be parsed later and replaced with a view from a specific component.
 *
 * @name ComponentHelper
 * @constructor
 */
function ComponentHelper() {}

/**
 * The helper receives in the context information about the Rain environment, like the current
 * component and the current list of existing versioned components.
 *
 * The helper decides what view should use and from what component, adds the information to the
 * tag library of the current component and then generates the HTML tag.
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
 * @returns {String} the generated custom HTML tag
 */
ComponentHelper.prototype.helper = function (options) {
    var self = this;
    var childComponent = {
        componentId : options.hash['name'],
        version : options.hash['version'],
        viewId : options.hash['view'],
        staticId : options.hash['sid'],
        data : options.hash['data']
    };

    var rain = renderer.rain;

    if(!childComponent.viewId){
        replaceWithError(
            500,
            childComponent,
            new RainError('precondition failed: you have to specify a view id with view="VIEWID"!')
        );
    }

    if(childComponent.version && !childComponent.componentId){
        replaceWithError(
            500,
            childComponent,
            new RainError('precondition failed: the component name is required if you are specifying the version!')
        );
    }

    if (!childComponent.componentId) {
        childComponent.componentId = rainComponent.id;
        childComponent.version = rainComponent.version;
    } else {
        childComponent.version = componentRegistry.getLatestVersion(childComponent.componentId, childComponent.version);
        if (!childComponent.version) {
            replaceWithError(
                404,
                childComponent,
                new RainError('Component ' + childComponent.componentId + ' not found!')
            );
        }
    }

    var transport = rain.transport;
    transport.renderLevel++;
    //TODO find better way to create instance ids....
    var instanceId = renderer.createInstanceId(rain.instanceId, transport.renderCount++);

    var component = componentRegistry.getConfig(childComponent.componentId, childComponent.version);
    rain.childrenInstanceIds.push({
        id: childComponent.componentId,
        version: childComponent.version,
        staticId: childComponent.staticId,
        controller: component.views[childComponent.viewId].controller && component.views[childComponent.viewId].controller.client,
        instanceId: instanceId
    });

    var time = Date.now();
    dataLayer.loadData({
        id: childComponent.componentId,
        viewId: childComponent.viewId,
        version: childComponent.version,
        data: childComponent.data
    }, function(err, templateData){
        console.debug("Data loading time:", Date.now()-time, 'ms');
        if(err){
            console.log(err);
        }
        if(!templateData){
            templateData = {};
        }
        templateData.rain = self.rain;
        var renderingTime = Date.now();
        renderer.sendComponent(rain.transport, {
            component: component,
            viewId: childComponent.viewId,
            staticId: childComponent.staticId,
            instanceId: instanceId,
            data: templateData,
            rain: rain
        });
        console.debug("Rendering time:", Date.now()-renderingTime, 'ms');
        console.debug("Reponse time for the component:", Date.now()-time, 'ms');
    });


    return createPlaceholder(instanceId);
};

/**
 * Creates the placeholder
 *
 * @private
 */
function createPlaceholder(instanceId){
    return new Handlebars.SafeString('<div id="'+instanceId+'"></div>\n');
}


function replaceWithError(statusCode, childComponent, exception) {
    var error = errorHandler.getErrorComponent(statusCode);
    childComponent.componentId = error.component.id;
    childComponent.version = error.component.version;
    childComponent.viewId = error.view;
    exception.stack = exception.stack.replace(/ /g, '&nbsp;').replace(/\n/g, '<br />');
    childComponent.data = { error: exception };
};

/**
 * Creates the security context and freeze the it after the creation.
 *
 * @param {Object} preferences
 * @returns {securityContext} securityContext
 * @private
 * @memberOf ComponentHelper#
 */
function createSecurityContext(preferences) {
    var securityContext = {};

    securityContext = {
        user: Object.create(preferences.user)
    };

    return securityContext;
}

module.exports = {
    name: 'component',
    helper: new ComponentHelper().helper
};

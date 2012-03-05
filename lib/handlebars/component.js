"use strict";

var path = require('path');
var handlebars = require('handlebars');
var errorHandler = require('../error_handler.js');
var authorization = require('../authorization');
var util = require('../util');
var componentRegistry = require('../component_registry');
var dataLayer = require('../data_layer');
var renderer = require('../renderer');

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
    var componentId = options.hash['name'];
    var version = options.hash['version'];
    var viewId = options.hash['view'];
    var sid = options.hash['sid'];
    var data = options.hash['data'];
    

    if (!this.rain || typeof this.rain !== 'function') {
        throw { message: 'precondition failed: rain function is missing.', type: 'templating' };
    }

    var rain = this.rain();
    var rainComponent = rain.component;

    if (!rainComponent) {
        throw { message: 'precondition failed: component attribute is missing.', type: 'templating' };
    }

    if(!viewId){
        throw { message: 'precondition failed: you have to specify a view id with view="VIEWID"!', type: 'templating' };
    }

    if(version && !componentId){
        throw { message: 'precondition failed: the component name is required if you are specifying the version!', type: 'templating' };
    }

    if (!componentId) {
        componentId = rainComponent.id;
        version = rainComponent.version;
    } else {
        version = componentRegistry.getLatestVersion(componentId, version);
        if (!version) {
            throw { message: 'Component ' + componentId + ' not found!', type: 'templating' };
        }
    }
    
    dataLayer.loadData({
        id: componentId,
        viewId: viewId,
        version: version,
        data: data
    }, function(err, templateData){
        if(err){
            throw err;
        } else {
            if(!templateData){
                templateData = {};
            }
            templateData.rain = self.rain;
            var renderedComponent = renderer.renderComponent({
                component: componentRegistry.getComponent(componentId, version),
                viewId: viewId,
                data: templateData
            });
            handleResponse(renderedComponent, rain.res);
        }
    });
    
    //TODO create instanceIds
    var placeholder = createPlaceholder();

    return placeholder;
};

/**
 * Creates the placeholder
 * 
 * @private
 */
function createPlaceholder(){
    return '<div class="placeholder"></div>';
}

/**
 * @param {Object} renderedComponent,
 * @private
 */
function handleResponse(renderedComponent, response){
    console.log(renderedComponent);
    response.write('<script type="text/javascript">renderComponent('+JSON.stringify(renderedComponent)+')</script>');
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


"use strict";

var mod_path = require('path');
var mod_logger = require('../logger.js').getLogger(mod_path.basename(module.filename));
var mod_handlebars = require('handlebars');
var mod_errorHandler = require('../error_handler.js');
var mod_authorization = require('../authorization');
var mod_util = require('../util');

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
 * 1. if the name key is not specified, the current component id will be used.
 *
 * 2. if the version is not specified and the name key is present, the latest version
 *    for the component at step 1 is found and used.
 *
 * 3. if the view key is not specified, the default ``index`` view will be used.
 *
 * @param {Object} options the component options
 * @param {String} [options.name] the component id
 * @param {String} [options.version] the component version
 * @param {String} [options.view='index'] the view id.
 * @param {String} [options.sid='undefined'] the component static id, used in the client-side controller
 * @throws {Error} when the context has the wrong keys
 * @returns {String} the generated custom HTML tag
 */
ComponentHelper.prototype.helper = function (options) {
    var component = options.hash['name'];
    var version = options.hash['version'];
    var view = options.hash['view'];
    var sid = options.hash['sid'];

    if (!this.rain || typeof this.rain !== 'function') {
        throw new Error('precondition failed: rain function is missing.');
    }

    var rain = this.rain();
    var rainComponent = rain.component;

    if (!rainComponent) {
        throw new Error('precondition failed: component attribute is missing.');
    }

    var componentContainer = rainComponent.componentcontainer;

    if(!view){
        throw new Error('precondition failed: you have to specify a view id with view="VIEWID"!');
    }

    if(version && !component){
        throw new Error('precondition failed: the component name is required if you are specifying the version!');
    }

    if (!component) {
        component = rainComponent.config.id;
        version = rainComponent.config.version;
    } else {
        version = componentContainer.getLatestVersion(component, version);
        if (!version) {
            return returnErrorComponent(404, 'Component ' + component + ' not found!',
                                        rainComponent, componentContainer);
        }
    }

    var module = component + ';' + version;
    var selector = generateSelector(component, version, view);

    var configuration = componentContainer.getConfiguration(module);
    var requiredView = componentContainer.getViewByViewId(configuration, view);

    if (!requiredView) {
        return returnErrorComponent(404, 'Component ' + configuration.id + ' does not contain the view ' + view,
                                    rainComponent, componentContainer);
    }

    var permissions = [].concat(configuration.permissions || [], requiredView.permissions || []);

    var dynamicConditions = [];

    // Add component dynamic conditions.
    if (configuration.dynamicConditions && configuration.dynamicConditions._component) {
        dynamicConditions.push(configuration.dynamicConditions._component);
    }

    // Add view dynamic conditions.
    if (configuration.dynamicConditions && configuration.dynamicConditions[view]) {
        dynamicConditions.push(configuration.dynamicConditions[view]);
    }

    var securityContext = createSecurityContext({
        user : rain.session && rain.session.user
    });

    if (!mod_authorization.authorize(securityContext,
                                    permissions,
                                    dynamicConditions)) {
        return returnErrorComponent(401, 'Unauthorized access to component "' + component + '" !',
                                    rainComponent, componentContainer);
    }

    rainComponent.addTagLib({
        namespace: '',
        selector: selector,
        module: module,
        view: requiredView.view
    });

    return renderHtml(selector, sid);
};

/**
 * Generate a selector string.
 *
 * @param {String} component the component id
 * @param {String} version the component version
 * @param {String} view the view id
 * @returns {String} the generated selector string
 * @private
 * @memberOf ComponentHelper#
 */
function generateSelector(component, version, view) {
    var selector = component + '_' + version.replace(/[.]+/g, '_') + '_' + view;
    return selector.replace(/[^a-zA-Z0-9_-]+/g, '');
}

/**
 * Returns the generated custom tag of the error component for the parser aggregation
 *
 * @param {Number} statusCode The status code for the error component
 * @param {String} errorMessage The error message which gets written to the logfile
 * @param {WebComponent} rainComponent Webcomponent where the taglib is added
 * @param {ComponentContainer} componentContainer The component container
 * @returns {String} The generated HTML tag
 * @private
 * @memberOf ComponentHelper#
 */
function returnErrorComponent(statusCode, errorMessage, rainComponent, componentContainer){
    var errorHandler = new mod_errorHandler(componentContainer);

    var tagLib = errorHandler.renderError(statusCode, new Error(errorMessage));

    if (!tagLib) {
        return;
    }

    rainComponent.addTagLib(tagLib);

    return renderHtml(tagLib.selector);
}

/**
 * Generate a link tag based on the file path.
 *
 * @param {String} selector the selector string
 * @param {String} sid the static id
 * @returns {String} the generated HTML tag
 * @private
 * @memberOf ComponentHelper#
 */
function renderHtml(selector, sid) {
    var html;
    if (sid) {
        html = '<' + selector + ' data-sid="' + sid + '" />';
    } else {
        html = '<' + selector + ' />';
    }
    return new mod_handlebars.SafeString(html);
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
        user: preferences.user
    };

    mod_util.freezeObject(securityContext);

    return securityContext;
}

module.exports = {
    name: 'component',
    helper: new ComponentHelper().helper
};

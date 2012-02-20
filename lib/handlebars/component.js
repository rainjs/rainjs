var mod_path = require('path');
var mod_logger = require('../logger.js').getLogger(mod_path.basename(module.filename));
var mod_handlebars = require('handlebars');
var mod_exceptionHandler = require('../exception_handler.js');
var mod_authorization = require('../authorization');
var util = require('../util');

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
 * @param {String} [options.sid|undefined] the component static id, used in the client-side controller
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

    view = view || 'index';

    if (!component) {
        component = rainComponent.config.id;
        version = rainComponent.config.version;
    }

    var componentContainer = rainComponent.componentcontainer;
    var exceptionHandler = new mod_exceptionHandler(componentContainer);
    version = componentContainer.getLatestVersion(component, version);
    if (!version) {
        var tagLib = exceptionHandler.renderException(404,
                        new Error('Component ' + component + ' not found!'));
        rainComponent.addTagLib(tagLib);

        if (!tagLib) {
            return;
        }

        return renderHtml(tagLib.selector);
    } else {
        var module = component + ';' + version;
        var selector = generateSelector(component, version, view);

        var configuration = componentContainer.getConfiguration(module);
        var requiredView = componentContainer.getViewByViewId(configuration, view);

        if (!requiredView) {
            var tagLib = exceptionHandler.renderException(404,
                new Error('Component ' + configuration.id + ' does not contain the view ' + view));

            if (!tagLib) {
                return;
            }

            rainComponent.addTagLib(tagLib);

            return renderHtml(tagLib.selector);
        }

        var permissions = [];
        //add component permissions
        if (configuration.permissions) {
            permissions = permissions.concat(configuration.permissions);
        }
        //add view permissions
        if (requiredView.permissions) {
            permissions = permissions.concat(requiredView.permissions);
        }

        var securityContext = createSecurityContext({
            user : rain.session && rain.session.user
        });

        var dynamicConditions = [];
        if(configuration.dynamicConditions && configuration.dynamicConditions._component) {
            dynamicConditions.push(configuration.dynamicConditions._component);
        }
        if(configuration.dynamicConditions && configuration.dynamicConditions[view]) {
            dynamicConditions.push(configuration.dynamicConditions[view]);
        }

        if (mod_authorization.authorize(securityContext,
                                        permissions,
                                        dynamicConditions) === false) {

            var tagLib = exceptionHandler.renderException(401,
                           new Error('Unauthorized access to component "' + component + '" !'));
            rainComponent.addTagLib(tagLib);

            return renderHtml(tagLib.selector);
        }

        rainComponent.addTagLib({
            namespace: '',
            selector: selector,
            module: module,
            view: requiredView.view
        });

        return renderHtml(selector, sid);
    }
}

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
    var selector = component + '_' + version + '_' + view;
    return selector.replace(/[^a-zA-Z0-9_-]+/g, '');
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
        user: preferences.user || null
    };

    util.freezeObject(securityContext);

    return securityContext;
}

module.exports = {
    name: 'component',
    helper: new ComponentHelper().helper
};

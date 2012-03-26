"use strict";

var componentRegistry = require('./component_registry');
var errorHandler = require('./error_handler');
var authorization = require('./authorization');
var extend = require('node.extend');

/**
 * Constant used when checking if the user can see a view.
 */
var AUTHORIZATION_TYPE_VIEW = 1;

/**
 * Constant used when checking if the user can use a server type intent.
 */
var AUTHORIZATION_TYPE_INTENT = 2;

/**
 * Replaces the current component with an error component.
 *
 * @param {Number} statusCode Status code of the error
 * @param {Object} component information as a reference
 * @param {RainError} exception The specified error
 */
function replaceWithError(statusCode, component, exception) {
    var error = errorHandler.getErrorComponent(statusCode);
    component.id = error.component.id;
    component.version = error.component.version;
    component.view = error.view;
    exception.stack = exception.stack.replace(/ /g, '&nbsp;').replace(/\n/g, '<br />');
    component.context = { error: exception };
};

/**
 * Check if the view is valid.
 *
 * @param {Object} component Component object
 * @param {String} component.id Component id
 * @param {String} component.view Component view id
 * @param {String} component.version Component version
 * @return {Boolean}
 */
function isValidView(component, rainContext){
    if (!component.view) {
        replaceWithError(500, component,
            new RainError('You have to specify a view id with view="VIEWID"!',
                          RainError.ERROR_PRECONDITION_FAILED)
        );
        return false;
    }

    if (component.version && !component.id) {
        replaceWithError(500, component,
            new RainError('The component name is required if you are specifying the version!',
                          RainError.ERROR_PRECONDITION_FAILED)
        );
        return false;
    }

    if (!component.id) {
        component.id = rainContext.component.id;
        component.version = rainContext.component.version;
    } else {
        component.version = componentRegistry.getLatestVersion(component.id,
                                                                    component.version);
        if (!component.version) {
            replaceWithError(404, component,
                new RainError('Component %s not found!', [component.id])
            );
            return false;
        }
    }

    var componentConfig = componentRegistry.getConfig(component.id,
                                                      component.version);
    if (!componentConfig.views[component.view]){
        replaceWithError(404, component,
             new RainError("The  view %s dosn't exists!", [component.view])
        );
        return false;
    }

    return true;
};

/**
 * Checks the user permissions.
 *
 * @param {Object} component The component information for the rendering process
 * @param {Number} type the authorization type
 * @return {Boolean} Returns the authorization status
 */
function isAuthorized(component, type) {
    var componentConfig = componentRegistry.getConfig(component.id,
                                                      component.version);
    var dynamicConditions = [];
    var permissions = [].concat(componentConfig.permissions || []);

    if (type === this.AUTHORIZATION_TYPE_VIEW) {
        permissions = permissions.concat(componentConfig.views[component.view].permissions || []);

        // Add component dynamic conditions.
        if (componentConfig.dynamicConditions && componentConfig.dynamicConditions._component) {
            dynamicConditions.push(componentConfig.dynamicConditions._component);
        }

        // Add view dynamic conditions.
        if (componentConfig.dynamicConditions &&
            componentConfig.dynamicConditions[component.view]) {
            dynamicConditions.push(componentConfig.dynamicConditions[component.view]);
        }
    } else if (type === this.AUTHORIZATION_TYPE_INTENT) {
        permissions = permissions.concat(component.intentPermissions || []);
    }

    var securityContext = createSecurityContext({
        user: component.session && component.session.user
    });

    return authorization.authorize(securityContext, permissions, dynamicConditions);
};

/**
 * Creates the security context and freeze the it after the creation.
 *
 * @param {Object} preferences
 * @returns {securityContext} securityContext
 * @private
 */
function createSecurityContext(preferences) {
    return {
        user: preferences.user ? extend({}, preferences.user) : null
    };
}


module.exports = {
    replaceWithError: replaceWithError,
    isValidView: isValidView,
    isAuthorized: isAuthorized,
    AUTHORIZATION_TYPE_VIEW: AUTHORIZATION_TYPE_VIEW,
    AUTHORIZATION_TYPE_INTENT: AUTHORIZATION_TYPE_INTENT
};

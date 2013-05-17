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

var fs = require('fs'),
    path = require('path'),
    componentRegistry = require('./component_registry'),
    errorHandler = require('./error_handler'),
    authorization = require('./authorization'),
    extend = require('node.extend'),
    IdentityProvider = require('./security').IdentityProvider,
    configuration = require('./configuration'),
    logger = require('./logging').get(),
    Handlebars = require('handlebars');

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
}

/**
 * Check if the view is valid.
 *
 * @param {Object} component Component object
 * @param {String} component.id Component id
 * @param {String} component.view Component view id
 * @param {String} component.version Component version
 * @return {Boolean}
 */
function isValidView(component, rainContext) {
    if (!component.view && !component.id) {
        replaceWithError(500, component,
            new RainError('You have to specify a view id with view="VIEWID"!',
                          RainError.ERROR_PRECONDITION_FAILED)
        );
        return false;
    }

    if (!component.view && component.id) {
        component.view = 'index';
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
             new RainError("The  view %s doesn't exists!", [component.view])
        );
        return false;
    }

    return true;
}

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

    var idp = IdentityProvider.get(component.session);
    var securityContext = createSecurityContext({
        user: idp.getUser()
    });

    return authorization.authorize(securityContext, permissions, dynamicConditions);
}

/**
 * Processes the bootstrap configuration options.
 *
 * @returns {Object} the bootstrap information
 */
function processBootstrapScripts() {
    var bootstrap = configuration.bootstrap,
        bootstrapData = {
            metas: '',
            links: '',
            scripts: '',
            footer: {}
        };

    var filePath, fileContent, inlineContent = '';

    if (!bootstrap) {
        return bootstrapData;
    }

    if (bootstrap.head && bootstrap.headFile) {
        try {
            filePath = path.join(process.cwd(), bootstrap.headFile);
            fileContent = fs.readFileSync(filePath, 'utf8');

            bootstrapData.head = true;
            bootstrapData.headTags = fileContent;
        } catch (err) {
            logger.error('An error occurred while reading the bootstrap custom head file.', err);
        }
    }

    if (Array.isArray(bootstrap.metas)) {
        bootstrapData.metas = bootstrap.metas.join('\n');
    }

    if (Array.isArray(bootstrap.links)) {
        bootstrapData.links = bootstrap.links.join('\n');
    }

    if (Array.isArray(bootstrap.scripts)) {
        bootstrapData.scripts = bootstrap.scripts.join('\n');
    }

    if (bootstrap.footerScripts) {
        var external = bootstrap.footerScripts.external,
            inline = bootstrap.footerScripts.inline;

        if (Array.isArray(external)) {
            bootstrapData.footer.external = external.join('\n');
        }

        if (Array.isArray(inline)) {
            for (var i = 0, len = inline.length; i < len; i++) {
                try {
                    filePath = path.join(process.cwd(), inline[i]);
                    fileContent = fs.readFileSync(filePath, 'utf8');

                    inlineContent += fileContent + '\n';
                } catch (err) {
                    logger.error('An error occurred while reading an inline footer script file.',
                                 err);
                }
            }
            try {
                bootstrapData.footer.inline = Handlebars.compile(inlineContent);
                bootstrapData.footer.isCompiled = true;
            } catch (err) {
                logger.warn('The inline footer scripts threw a Handlebars compile error', err);
                bootstrapData.footer.inline = inlineContent;
            }
        }
    }

    return bootstrapData;
}

/**
 * Creates the security context and freeze the it after the creation.
 *
 * @param {Object} preferences
 * @returns {securityContext} securityContext
 * @private
 */
function createSecurityContext(preferences) {
    return {
        user: preferences.user
    };
}

module.exports = {
    replaceWithError: replaceWithError,
    isValidView: isValidView,
    isAuthorized: isAuthorized,
    processBootstrapScripts: processBootstrapScripts,
    AUTHORIZATION_TYPE_VIEW: AUTHORIZATION_TYPE_VIEW,
    AUTHORIZATION_TYPE_INTENT: AUTHORIZATION_TYPE_INTENT
};

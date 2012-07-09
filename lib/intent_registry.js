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
    socketRegistry = require('./socket_registry'),
    componentRegistry = require('./component_registry'),
    renderer = require('./renderer'),
    renderUtils = require('./render_utils'),
    extend = require('node.extend');

var intents = {};

/**
 * Class that handles the registration and handling of user defined intents.
 *
 * @name IntentsRegistry
 * @class
 * @constructor
 */
function IntentsRegistry() {
    socketRegistry.register('/core', handleIntent);
}

/**
 * Registers an intent to the registry.
 *
 * @param {Object} component the configuration of the component that the intent belongs to
 * @param {Object} intent the intent to register
 */
IntentsRegistry.prototype.register = function (component, intent) {
    var categories = {};

    if (!intent.category) {
        throw new RainError('You need to specify a category for an intent in component: %s;%s.',
            [component.id, component.version], RainError.ERROR_PRECONDITION_FAILED, 'category');
    }

    if (!intent.action) {
        throw new RainError('You need to specify an action for an intent in component: %s;%s.',
            [component.id, component.version], RainError.ERROR_PRECONDITION_FAILED, 'action');
    }

    if (!intent.provider) {
        throw new RainError('You need to specify a provider for an intent in component: %s;%s.',
            [component.id, component.version], RainError.ERROR_PRECONDITION_FAILED, 'provider');
    }

    if (!intents[intent.category]) {
        intents[intent.category] = categories;
    } else {
        categories = intents[intent.category];
    }

    var actions = {};
    if (!categories[intent.action]) {
        categories[intent.action] = actions;
    } else {
        actions = categories[intent.action];
    }

    var intentId = component.id + '_' + component.version;
    if (actions[intentId]) {
        throw new RainError('Intent %s.%s is already registered.',
            [intent.category, intent.action], RainError.ERROR_PRECONDITION_FAILED, 'registered');
    }

    // split the provider by hashtag to figure out if it's a view or a controller
    var provider = intent.provider.split('#');

    switch (provider.length) {
        case 1: // seems like we got a view
            var view = provider[0];

            if (!component.views[view]) {
                throw new RainError('View %s was not found in %s;%s.',
                    [view, component.id, component.version], RainError.ERROR_PRECONDITION_FAILED, 'view');
            }

            actions[intentId] = {
                type: 'view',
                provider: {
                    component: component.id,
                    version: component.version,
                    view: view
                }
            };
            break;
        case 2: // we have a server side intent
            var controller = provider[0];
            var method = provider[1];

            var serverFolder = component.paths('server', true);
            var controllerPath = path.join(serverFolder, 'controller', controller);

            try {
                require.resolve(controllerPath);
            } catch (e) {
                throw new RainError(
                    'Controller %s, used as a provider for intent %s does not exist.',
                    [controller, intent.category + '.' + intent.action],
                    RainError.ERROR_PRECONDITION_FAILED, 'controller');
            }

            if (!(method in require(controllerPath))) {
                throw new RainError(
                    'Controller %s, used as a provider for intent %s does not not contain method %s.',
                    [controller, intent.category + '.' + intent.action, method],
                    RainError.ERROR_PRECONDITION_FAILED, 'no_method');
            }

            actions[intentId] = {
                type: 'server',
                provider: {
                    component: component.id,
                    version: component.version,
                    permissions: intent.permissions,
                    controllerPath: controllerPath,
                    method: method
                }
            };
            break;
        default:
            throw new RainError('Invalid syntax in the provider for the intent %s',
                [intent.category + '.' + intent.action],
                RainError.ERROR_PRECONDITION_FAILED, 'invalid');
    }
};

/**
 * Handles intent requests from the user.
 *
 * @param {Socket} socket the socket to handle
 * @private
 * @memberOf IntentsRegistry#
 */
function handleIntent(socket) {
    var handler;
    socket.on('request_intent', function (intent, acknowledge) {
        if (!intent.category) {
            acknowledge(new RainError("You must specify intent category.",
                RainError.ERROR_PRECONDITION_FAILED, 'category'));
            return;
        }

        if (!intent.action) {
            acknowledge(new RainError("You must specify intent action.",
                RainError.ERROR_PRECONDITION_FAILED, 'action'));
            return;
        }

        if (!intent.context) {
            acknowledge(new RainError("You must specify intent context",
                RainError.ERROR_PRECONDITION_FAILED, 'context'));
            return;
        }

        try {
            handler = resolveIntent(intent.category, intent.action);
        } catch (ex) {
            acknowledge(ex);
            return;
        }

        switch (handler.type) {
            case 'view':
                var mainComponent = componentRegistry.getConfig('core',
                                                componentRegistry.getLatestVersion('core'));

                //create customContext for the view
                var context = extend({}, intent.context,
                    {
                        cmp: {
                            name: handler.provider.component,
                            view: handler.provider.view,
                            version: handler.provider.version
                        }
                    }
                );
                //remove instanceId
                delete context.instanceId;

                renderer.sendComponent(socket, {
                    component: mainComponent,
                    viewId: 'dialog',
                    instanceId: intent.context.instanceId,
                    context: context,
                    rain: renderer.createRainContext({
                        component: handler.component,
                        transport: socket,
                        session: socket.session
                    })
                });
                break;
            case 'server':
                var component = {
                    id: handler.provider.component,
                    version: handler.provider.version,
                    intentPermissions: handler.provider.permissions,
                    session: socket.session
                };

                if (!renderUtils.isAuthorized(component, renderUtils.AUTHORIZATION_TYPE_INTENT)) {
                    acknowledge(new RainError('Unauthorized access to component %s!',
                          [component.id], RainError.ERROR_HTTP, 401));
                    return;
                }

                try {
                    var controller = require(handler.provider.controllerPath);
                    controller[handler.provider.method](intent.context, acknowledge);
                } catch (ex) {
                    acknowledge(new RainError('Internal intent error for component %s!',
                          [component.id], RainError.ERROR_HTTP, 500));
                    return;
                }
                break;
        }
    });
}

/**
 * Resolves an intent received from a user.
 *
 * @param {String} category the intent category
 * @param {String} action the intent action
 * @throws {RainError} if the parameters are invalid
 * @returns {String|Array} the handler for the resolved intent or the error message
 */
function resolveIntent(category, action) {
    var categories = intents[category];
    if (!categories) {
        throw new RainError('Intent category %s was not found.', [category],
            RainError.ERROR_PRECONDITION_FAILED, 'category');
    }

    var handlers = categories[action];
    if (!handlers) {
        throw new RainError('Intent action %s was not found.', [action],
            RainError.ERROR_PRECONDITION_FAILED, 'action');
    }

    // Multiple intent handlers not supported yet.
    for (var key in handlers) {
        return handlers[key];
    }

    return handlers;
}

module.exports = new IntentsRegistry();

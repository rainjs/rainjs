"use strict";

var path = require('path');
var socketRegistry = require('./socket_registry');
var componentRegistry = require('./component_registry');
var renderer = require('./renderer');

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
                            [component.id, component.version]);
    }

    if (!intent.action) {
        throw new RainError('You need to specify an action for an intent in component: %s;%s.',
                            [component.id, component.version]);
    }

    if (!intent.type) {
        throw new RainError('You need to specify a type for an intent in component: %s;%s.',
                            [component.id, component.version]);
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
                            [intent.category, intent.action]);
    }

    switch (intent.type) {
        case 'view':
            if (!component.views[intent.view]) {
                throw new RainError('View %s was not found in %s.', [intent.view, component.id]);
            }

            actions[intentId] = {
                type: intent.type,
                provider: {
                    component: component.id,
                    version: component.version,
                    view: intent.view
                }
            };
            break;
        case 'server':
            if (!intent.controller) {
                throw new RainError('You need to specify a controller for an intent in ' +
                                    'component: %s;%s.', [component.id, component.version]);
            }

            if (!intent.method) {
                throw new RainError('You need to specify a method for an intent in ' +
                                    'component: %s;%s.', [component.id, component.version]);
            }

            var serverFolder = component.paths('server', true);
            var controllerPath = path.join(serverFolder, 'controller', intent.controller);
            actions[intentId] = {
                type: intent.type,
                provider: {
                    component: component.id,
                    version: component.version,
                    permissions: intent.permissions,
                    controllerPath: controllerPath,
                    method: intent.method
                }
            };
            break;
        default:
            throw new RainError('Intent %s.%s has an invalid type: %s.',
                                [intent.category, intent.action, intent.type]);
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
    socket.on('request_intent', function (intent, acknowledge) {
        if (!intent.category) {
            acknowledge("You must specify intent category.");
            return;
        }

        if (!intent.action) {
            acknowledge("You must specify intent action.");
            return;
        }

        if (!intent.context) {
            acknowledge("You must specify intent context");
            return;
        }

        var handler = resolveIntent(intent.category, intent.action);

        switch (handler.type) {
            case 'view':
                var mainComponent = componentRegistry.getConfig('core',
                                                componentRegistry.getLatestVersion('core'));
                renderer.sendComponent(socket, {
                    component: mainComponent,
                    viewId: 'dialog',
                    instanceId: intent.context.instanceId,
                    context: {
                        cmp: {
                            name: handler.provider.component,
                            view: handler.provider.view,
                            version: handler.provider.version
                        }
                    },
                    rain: renderer.createRainContext({
                        component: handler.component,
                        transport: socket
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

                if (!renderer.isAuthorized(component, renderer.AUTHORIZATION_TYPE_INTENT)) {
                    acknowledge('Unauthorized access to component ' + component.id + '!');
                    return;
                }

                try {
                    var controller = require(handler.provider.controllerPath);
                } catch (ex) {
                    throw new RainError('Could not require controller for server intent %s.%s.',
                                        [intent.category, intent.action]);
                }

                try {
                    controller[handler.provider.method](intent.context);
                } catch (ex) {}
                break;
        }

        acknowledge();
    });
}

/**
 * Resolves an intent received from a user.
 *
 * @param {String} category the intent category
 * @param {String} action the intent action
 * @returns {Array} the handlers for the resolved intent
 */
function resolveIntent(category, action) {
    var categories = intents[category];
    if (!categories) {
        throw new RainError('Intent category %s was not found.', [category]);
    }

    var handlers = categories[action];
    if (!handlers) {
        throw new RainError('Intent action %s was not found.', [action]);
    }

    // Multiple intent handlers not supported yet.
    for (var key in handlers) {
        return handlers[key];
    }
    return handlers;
}

module.exports = new IntentsRegistry();

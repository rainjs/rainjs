"use strict";

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

        var handlers = resolveIntent(intent.category, intent.action,
                                     intent.context, intent.preferences);

        // Multiple intent handlers not supported yet.
        var response = handlers[0];

        switch (response.type) {
            case 'view':
                var mainComponent = componentRegistry.getConfig('core',
                                                componentRegistry.getLatestVersion('core'));
                renderer.sendComponent(socket, {
                    component: mainComponent,
                    viewId: 'dialog',
                    instanceId: intent.context.instanceId,
                    context: {
                        cmp: {
                            name: response.provider.component,
                            view: response.provider.view,
                            version: response.provider.version
                        }
                    },
                    rain: renderer.createRainContext({
                        component: response.component,
                        transport: socket
                    })
                });
                break;
            case 'server':
                try {
                    var controller = require(response.controllerPath);
                } catch (e) {
                    throw new RainError('Could not require controller for server intent %s.%s.',
                                        [intent.category, intent.action]);
                }

                try {
                    controller[response.method]();
                } catch (e) {}
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
    var category = intents[category];
    if (!category) {
        throw new RainError('Intent category %s was not found.', [category]);
    }

    var handlers = category[action];
    if (!handlers) {
        throw new RainError('Intent action %s was not found.', [action]);
    }

    if (!handlers.length) {
        throw new RainError('No intent found for action %s.', [action]);
    }

    return handlers;
}

module.exports = new IntentsRegistry();

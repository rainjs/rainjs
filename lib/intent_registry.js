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

    // split the provider by hashtag to figure out if it's a view or a controller
    var provider = intent.provider.split('#');

    switch (provider.length) {
        case 1: // seems like we got a view
            var view = provider[0];

            if (!component.views[view]) {
                throw new RainError('View %s was not found in %s;%s.',
                                    [view, component.id, component.version]);
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
                    [controller, intent.category + '.' + intent.action]);
            }

            if (!(method in require(controllerPath))) {
                throw new RainError(
                    'Controller %s, used as a provider for intent %s does not contain method %s.',
                    [controller, intent.category + '.' + intent.action, method]);
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
                [intent.category, '.', intent.action].join(' '));
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
            acknowledge(new RainError("You must specify intent category."));
            return;
        }

        if (!intent.action) {
            acknowledge(new RainError("You must specify intent action."));
            return;
        }

        if (!intent.context) {
            acknowledge(new RainError("You must specify intent context"));
            return;
        }

        try {
            var handler = resolveIntent(intent.category, intent.action);
        } catch (ex) {
            acknowledge(ex);
            return;
        }

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

                if (!renderer.isAuthorized(component, renderer.AUTHORIZATION_TYPE_INTENT)) {
                    acknowledge(new RainError('Unauthorized access to component %s!',
                                              [component.id]));
                    return;
                }

                try {
                    var controller = require(handler.provider.controllerPath);
                    controller[handler.provider.method](intent.context);
                } catch (ex) {
                    acknowledge(new RainError('Internal intent error for component %s!',
                                              [component.id]));
                    return;
                }
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
 * @throws {RainError} if the parameters are invalid
 * @returns {String|Array} the handler for the resolved intent or the error message
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

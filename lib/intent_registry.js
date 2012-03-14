"use strict";

var socketRegistry = require('./socket_registry');
var componentRegistry = require('./component_registry');
var Renderer = require('./renderer');

var intents = {};

/**
 * Class that handles the registration and handling of user defined intents.
 *
 * @constructor
 */
function IntentsRegistry () {
    socketRegistry.register('/core', handleIntent);
};

/**
 * Registers an intent to the registry.
 *
 * @param {Object} component the configuration of the component that the intent belongs to
 * @param {Object} intent the intent to register
 */
IntentsRegistry.prototype.register = function (component, intent) {
    var categories = {};

    if (!intent.category) {
        throw new RainError('You need to specify a category for an intent in component: ' + component.id + ';' + component.version);
    }

    if (!intent.action) {
        throw new RainError('You need to specify a action for an intent in component: ' + component.id + ';' + component.version);
    }

    if (!intent.provider) {
        throw new RainError('You need to specify a provider for an intent in component: ' + component.id + ';' + component.version);
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
        throw new RainError(['Intent', intent.category, '.', intent.action, 'is already registered.'].join(' '));
    }

    switch (intent.type) {
        case 'view':
            if (!component.views[intent.provider]) {
                throw new RainError(['View', intent.provider, 'was not found in',
                                     component.id].join(' '));
            }

            actions[intentId] = {
                type: intent.type,
                provider: {
                    component: component.id,
                    version: component.version,
                    view: intent.provider
                }
            };
            break;
        case 'server':
            actions[intentId] = {
                type: intent.type,
                provider: {controller: intent.provider, method: intent.method}
            };
            break;
    }
};

/**
 * Handles intent requests from the user.
 *
 * @param {Socket} socket the socket to handle
 * @private
 */
function handleIntent(socket) {
    socket.on('request_intent', function (intent, acknowledge) {
        var response;

        if(!intent.category) {
            acknowledge("You must specify intent category.");
            return;
        }

        if(!intent.action) {
            acknowledge("You must specify intent action.");
            return;
        }

        if(!intent.context) {
            acknowledge("You must specify intent context");
            return;
        }

        handlers = resolveIntent(intent.category, intent.action, intent.context, intent.preferences);

        if (handlers.length === 1) {
            response = handlers[0];
        } else {
            return; // multiple intent handlers not supported yet
        }

        switch (response.type) {
            case 'view':
                var mainComponent = componentRegistry.getConfig('core',
                                                componentRegistry.getLatestVersion('core'));
                Renderer.sendComponent(socket, {
                    component: mainComponent,
                    viewId: 'dialog',
                    instanceId: intent.context.instanceId,
                    data: {
                        cmp: {
                            name: response.provider.component,
                            view: response.provider.view,
                            version: response.provider.version
                        }
                    },
                    rain: Renderer.createRainContext({
                        component: response.component,
                        transport: socket
                    })
                });
                break;
            case 'server':
                try {
                    var controller = require(response.controller);
                } catch (e) {
                    throw new RainError('Could not require controller for server intent ' +
                                        intent.category + '.' + intent.action + '.');
                }

                try {
                    controller[response.method]();
                } catch (e) {}
                break;
        }

        acknowledge();
    });
};

/**
 * Resolves an intent received from a user.
 *
 * @param {String} category the intent category
 * @param {String} action the intent action
 */
function resolveIntent(category, action) {
    var handlers = [];
    var category = intents[category];
    if (!category) {
        throw new RainError(['Intent category', category, 'was not found.'].join(' '));
    }

    var action = category[action];
    if (!action) {
        throw new RainError(['Intent action', action, 'was not found.'].join(' '));
    }


    for (var key in action) {
        var intent = action[key];

        handlers.push(intent);
    }

    if (!handlers.length) {
        throw new RainError(['No intent found for action', action].join(' '));
    }

    return handlers;
}

module.exports = new IntentsRegistry();

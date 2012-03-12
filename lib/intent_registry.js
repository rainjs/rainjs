var socketRegistry = require('./socket_registry');
var componentRegistry = require('./component_registry');
var Renderer = require('./renderer');

var intents = {};

function IntentsRegistry () {
    socketRegistry.register('/core', handleIntent);

};

IntentsRegistry.prototype.register = function (component, intent) {
    var categories = {};
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
        throw new RainError(['Intent', intentId, 'is already registered.'].join(' '));
    }

    switch (intent.type) {
        case 'view':
            if (!component.views[intent.provider]) {
                throw new RainError(['View', intent.provider, 'was not found in', component.id].join(' '));
            }

            actions[intentId] = {
                type: intent.type,
                provider: {component: component.id, version: component.version, view: intent.provider}
            };
            break;
    }
};

function handleIntent(socket) {
    socket.on('request_intent', function (intent, acknowledge) {
        var err = null;
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
            var response = handlers[0];
        }

        var mainComponent = componentRegistry.getConfig('core', componentRegistry.getLatestVersion('core'));
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

        acknowledge();
    });
};

function resolveIntent(category, action, context, preferences) {
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

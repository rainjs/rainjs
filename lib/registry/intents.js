var IntentRegistry = require('../intent_registry');

function IntentHandler() {};

IntentHandler.prototype.name = 'Intents Plugin';

/**
 *
 * @param {Object} componentConfig The component config given from the ComponentRegistry
 */
IntentHandler.prototype.configure = function (componentConfig) {
    if (!componentConfig.intents || componentConfig.intents.length === 0) {
        return;
    }

    for (var i = componentConfig.intents.length; i--;) {
        var intent = componentConfig.intents[i];
        IntentRegistry.register(componentConfig, intent);
    }
};

module.exports = new IntentHandler();

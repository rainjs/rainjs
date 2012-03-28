"use strict";

var intentRegistry = require('../intent_registry');

/**
 * Register the component's intents.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(componentConfig) {
    if (!componentConfig.intents || componentConfig.intents.length === 0) {
        return;
    }

    for (var i = componentConfig.intents.length; i--;) {
        var intent = componentConfig.intents[i];
        intentRegistry.register(componentConfig, intent);
    }
}

module.exports = {
    name: "Intents Plugin",
    configure: configure
};

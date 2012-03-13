var IntentRegistry = require('../intent_registry');

IntentHandler.prototype.name = 'Intents Plugin';

IntentHandler.prototype.configure = function (comp) {
    if (!comp.intents || comp.intents.length === 0) {
        return;
    }

    for (var i = comp.intents.length; i--;) {
        var intent = comp.intents[i];
        IntentRegistry.register(comp, intent);
    }
};

module.exports = new IntentHandler();

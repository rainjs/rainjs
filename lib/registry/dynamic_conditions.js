"use strict";

var path = require('path');

/**
 * Loads the dynamic conditions.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(componentConfig) {
    var conditionsPath = path.join(componentConfig.paths('server', true), 'authorization.js');

    try {
        componentConfig.dynamicConditions = require(conditionsPath);
    } catch (exception) {
        // Nothing should happen if the authorization.js doesn't exist, since it is optional.
    }
}

module.exports = {
    name: "Dynamic conditions plugin",
    configure: configure
};

"use strict";

var configuration = require('./configuration');

/**
 * Exports specific platform functionality. This singleton object can be accessed from the
 * server-side controllers, dynamic conditions functions, data-layer functions and it provides
 * useful information about the RAIN environment.
 *
 * @name Environment
 * @class
 * @constructor
 *
 * @property {String} language the platform language
 */
function Environment() {
    this.language = configuration.language;
    // TODO insert the environment context into server-side controllers and dynamic conditions.
}

module.exports = new Environment();

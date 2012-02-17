util = module.exports = require('util');

/**
 * Freezes an object and it's properties recursively in order to prevent modifications
 *
 * @param {Object} obj the object to be frozen
 */
util.freezeObject = function (obj) {
    var prop, value;
    for (prop in obj) {
        value = obj[prop];

        if (typeof value === 'object') {
            util.freezeRecursive(value);

            Object.freeze(value);
        }
    }
};


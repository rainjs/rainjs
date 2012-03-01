
"use strict";

var util = module.exports = require('util');
var nodeExtend = require('node.extend');

/**
 * Freezes an object and it's properties recursively in order to prevent modifications.
 *
 * @param {Object} obj the object to be frozen
 */
util.freezeObject = function (obj) {
    var prop, value;
    for (prop in obj) {
        value = obj[prop];

        if (value && typeof value === 'object') {
            util.freezeObject(value);

            Object.freeze(value);
        }
    }
};

/**
 * Checks if an object is an array.
 *
 * @param {Object} obj the object to be checked
 * @returns {Boolean} true is the object is an array
 */
util.isArray = function (obj) {
    return Array.isArray(obj) ||
          (typeof obj === 'object' && objectToString(obj) === '[object Array]');
};

/**
 * Calls toString method for an object.
 *
 * @param {Object} obj the object
 * @returns {String} the toString value
 */
function objectToString(obj) {
    return Object.prototype.toString.call(obj);
}

/**
 * provide the jQuery extend port
 */
util.extend = nodeExtend;
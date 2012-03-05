
"use strict";

var util = module.exports = require('util');
var fs = require('fs');
var path = require('path');

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

<<<<<<< HEAD
/**
 * Checks if an object is an array.
 *
 * @param {Object} obj the object to be checked
 * @returns {Boolean} true is the object is an array
 */
util.isArray = function (obj) {
    return Array.isArray(obj) ||
          (typeof obj === 'object' && util.objectToString(obj) === '[object Array]');
};

/**
 * Calls toString method for an object.
 *
 * @param {Object} obj the object
 * @returns {String} the toString value
 */
util.objectToString = function (obj) {
    return Object.prototype.toString.call(obj);
}

/**
 * Reads a folder recursive and calls the callback to do something with a file
 *
 * @param {String} folder folder which has to be loaded
 * @param {Function} callback callback
 * @private
 */
util.walkDir = function (folder, callback) {
    var files = [];
    try {
        files = fs.readdirSync(folder);
    } catch (ex) {
        console.info('The folder', folder, 'doesn\'t exist!');
    }

    for (var i = 0, len = files.length; i < len; i++) {
        var file = files[i];
        var filePath = path.join(folder, file);

        var stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            util.walkDir(filePath, callback);
        } else {
            callback(filePath, file);
        }
    }
}

=======
>>>>>>> bb273ed7bcafa4973bdae1c4c8495f16ce0844e1

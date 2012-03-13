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

/**
 * Reads a folder recursive and calls the callback to do something with a file.
 *
 * @param {String} folder folder which has to be loaded
 * @param {Function} callback callback
 * @private
 */
util.walkDir = function (folder, callback) {
    var files = [];
    try {
        files = fs.readdirSync(folder);
    } catch (ex) {}

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
};

/**
 * Extends an object with the properties from another object. Common properties will be overwritten
 * with the values from the source object.
 *
 * @param {Object} target the object that will be extended
 * @param {Object} source the object that will supply the properties
 */
util.extendObject = function (target, source) {
    for (var key in source) {
        target[key] = source[key];
    }
};

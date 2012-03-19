"use strict";

/**
 * Template data
 */
function f400(environment, callback, data) {
    callback(null, data);
}

function f401(environment, callback, data) {
    callback(null, data);
}

function f403(environment, callback, data) {
    callback(null, data);
}

function f404(environment, callback, data) {
    callback(null, data);
}

function f408(environment, callback, data) {
    callback(null, data);
}

function f500(environment, callback, data) {
    callback(null, data);
}

function fDefault(environment, callback, data) {
    callback(null, data);
}

module.exports = {
    "400": f400,
    "401": f401,
    "403": f403,
    "404": f404,
    "408": f408,
    "500": f500,
    "default": fDefault
};

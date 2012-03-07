/**
 * Template data
 */
function f400(callback, data) {
    callback(null, data);
}

function f401(callback, data) {
    callback(null, data);
}

function f403(callback, data) {
    callback(null, data);
}

function f404(callback, data) {
    callback(null, data);
}

function f408(callback, data) {
    callback(null, data);
}

function f500(callback, data) {
    callback(null, data);
}

function fDefault(callback, data) {
    callback(null, data);
}

module.exports = {
    "400": f400,
    "401": f401,
    "403": f403,
    "404": f404,
    "408": f408,
//    "500": f500,
    "default": fDefault
};

"use strict";

/**
 * Template data
 */
function index(environment, callback, data) {
    setTimeout(function () {
        callback(null, data);
    }, 1000);
}

function level2(environment, callback, data) {
    setTimeout(function () {
        callback(null, {
            items: [
                'level3',
                'level3',
                'level3',
                'level3',
                'level3'
            ]
        });
    }, Math.floor(Math.random() * 3000));
}

function level3(environment, callback, data) {
    setTimeout(function () {
        callback(null, data);
    }, Math.floor(Math.random() * 3000));
}

module.exports = {
    index: index,
    level2: level2,
    level3: level3
};

"use strict";

/**
 * Template data
 */
function index(environment, callback, data) {
    callback(null, data);
}

function level2(environment, callback, data) {
    setTimeout(function () {
        callback(null, data);
    }, Math.floor(Math.random() * 1500));
}

function level3(environment, callback, data) {
    setTimeout(function () {
        callback(null, {
            old_data: data,
            new_data: 'my_new_data'
        });
    }, Math.floor(Math.random()*3000));
}

function with_customer_error(environment, callback, data){
    callback({
        arrrghhhhhh: "DAMMNNNNNNNNNN"
    }, data);
}

module.exports = {
    index: index,
    level2: level2,
    level3: level3,
    with_customer_error: with_customer_error
};

"use strict";

var console = require('console');
var util = require('util');
var program = require('commander');

function Logger() {
    extendConsole();
}

function extendConsole() {
    if (program.debug) {
        console.debug = function () {
            process.stdout.write(util.format.apply(this, arguments) + '\n');
        };
    } else {
        console.debug = function(){};
    }
}

module.exports = new Logger();

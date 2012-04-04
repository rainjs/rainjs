"use strict";

var console = require('console'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),
    program = require('commander'),
    config = require('./configuration');

function Logger() {
    extendConsole();
}

function extendConsole() {
    var fd = process.stdout,
        fdError = process.stderr;

    try {
        fd = fs.createWriteStream(path.join(config.server.serverRoot, config.server.logs.access), {
            flags: 'a+',
            encoding: 'utf8'
        });
    } catch (e) {}

    try {
        fdError = fs.createWriteStream(path.join(config.server.serverRoot, config.server.logs.error), {
            flags: 'a+',
            encoding: 'utf8'
        });
    } catch (e) {}

    console.info = console.log = function() {
        fd.write(util.format.apply(this, arguments) + '\n');
    };

    console.error = console.warn = function() {
        if (!fdError) {
            fd.write(util.format.apply(this, arguments) + '\n');
        } else {
            fdError.write(util.format.apply(this, arguments) + '\n');
        }
    };

    console.dir = function(object) {
        fd.write(util.inspect(object) + '\n');
    };

    if (program.debug) {
        console.debug = function () {
            fd.write(util.format.apply(this, arguments) + '\n');
        };
    } else {
        console.debug = function(){};
    }
}

module.exports = new Logger();

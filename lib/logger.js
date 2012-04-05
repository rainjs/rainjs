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

    if(program.daemon && process.platform != 'darwin' && process.platform != 'windows') {
        try {
            var fdPath = path.join(config.server.serverRoot, config.server.logs.access);
            if (!path.existsSync(path.dirname(fdPath))) {
                fs.mkdirSync(path.dirname(fdPath));
            }
            fd = fs.createWriteStream(fdPath, {
                flags: 'a+',
                encoding: 'utf8'
            });
        } catch (e) {}
        
        try {
            var fdPath = path.join(config.server.serverRoot, config.server.logs.error);
            if (!path.existsSync(path.dirname(fdPath))) {
                fs.mkdirSync(path.dirname(fdPath));
            }
            fdError = fs.createWriteStream(fdPath, {
                flags: 'a+',
                encoding: 'utf8'
            });
        } catch (e) {}
    }

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

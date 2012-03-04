"use strict";

var console = require('console');
var util = require('util');

function Logger() {
    this.initilize();
}

Logger.prototype.initilize = function() {
    extendConsole();
};

function extendConsole() {
    var debug = false;
    for(var i = process.argv.length; i--;){
        if(process.argv[i] == '--debug'){
            debug = true;
        }
    }
    if(debug){
        console.debug = function(){
            process.stdout.write(util.format.apply(this, arguments) + '\n');
        };
    } else {
        console.debug = function(){};
    }
}

module.exports = new Logger();

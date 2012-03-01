
"use strict";

var connect = require('connect');
var config = require('./configuration');
var router = require('./router');

var Server = function() {
    this.started = false;
    this.config = config;
};

Server.prototype.start = function(configPath) {
    if (!this.started) {
        config.load(configPath);
        var server = connect.createServer(
            router
        );
        server.listen(config.server.port);
        this.started = true;
        console.log("Server started");
    } else {
        console.log("Server already started");
    }
};

module.exports = new Server();

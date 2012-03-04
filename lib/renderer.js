"use strict";

var Handlebars = require('handlebars');
var server = require('./server');
var fs = require('fs');


function Renderer() {
    this.bootstrapTemplate = null;
    this.initialize();
};

Renderer.prototype.initialize = function() {
    var html = fs.readFileSync(server.config.server.componentPath + '/core/client/bootstrap.html').toString();
    this.bootstrapTemplate = Handlebars.compile(html);
};

module.exports = new Renderer();

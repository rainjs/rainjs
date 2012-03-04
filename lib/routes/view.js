"use strict";

var fs = require('fs');
var Handlebars = require('handlebars');

/**
 * The request handler
 *
 * @param request the request object
 * @param response the response object
 */
function handler(request, response, matches, next) {
    var server = require('../server');
    var html = fs.readFileSync(server.config.server.componentPath + '/core/client/bootstrap.html').toString();
    var mockData = {
        component: { title: 'Rain' },
        server: { env: 'development' }
    };
    var template = Handlebars.compile(html);
    
    response.setHeader('content-type', 'text/html; charset=UTF-8');
    response.end(template(mockData));
}

module.exports = {
    name: "View Route",
    route: /^\/(\w+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(\w+)$/,
    handler: handler,
    hasSession: true
};

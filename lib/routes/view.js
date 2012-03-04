"use strict";

/**
 * The request handler
 *
 * @param request the request object
 * @param response the response object
 */
function handler(request, response, matches, next) {
    var server = require('../server');
    var renderer = require('../renderer');
    
    var mockData = {
        component: { title: 'Rain' },
        server: { env: 'development' }
    };
    
    response.setHeader('content-type', 'text/html; charset=UTF-8');
    response.write(renderer.bootstrapTemplate(mockData));
    response.end('<script type="text/javascript">console.log(clientRenderer)</script>');
}

module.exports = {
    name: "View Route",
    route: /^\/(\w+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(\w+)$/,
    handler: handler,
    hasSession: true
};

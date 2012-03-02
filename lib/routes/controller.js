"use strict";

/**
 * The request handler
 *
 * @param request the request object
 * @param response the response object
 */
function handler(request, response, matches, next) {

}

module.exports = {
    name: "Controller Route",
    route: /\/(\w+)\/(\d\.?\d?\.?\d?)\/(?:controller)\/(\w+)/,
    handler: handler,
    hasSession: true,
};

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
    name: "View Route",
    route: /\/(\w+)\/(\d\.?\d?\.?\d?)\/(?:view)\/(\w+)/,
    handler: handler
};
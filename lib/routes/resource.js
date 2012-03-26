"use strict";

var routerUtils = require('../router_utils');

/**
 * Handles static resource requests.
 *
 * @param req the request object
 * @param res the response object
 */
function handle(req, res) {
    routerUtils.handleStaticResource(req, res, 10, 'resources');
}

module.exports = {
    name: "Resource Route",
    route: /^\/([\w-]+)\/(?:((?:\d\.)?\d\.\d)\/)?resources\/(.+)/,
    handle: handle
};

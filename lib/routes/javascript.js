"use strict";

var routerUtils = require('../router_utils');

/**
 * Handles the requests for JS files.
 *
 * @param {Request} req the request object
 * @param {Response} res the response object
 */
function handle(req, res) {   
    routerUtils.handleStaticResource(req, res, 604800, 'js');
}

module.exports = {
    name: "Javascript Route",
    route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:js)\/(.+)/,
    handle: handle
};

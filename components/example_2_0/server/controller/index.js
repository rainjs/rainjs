/**
 * Resolves the GET HTTP verb.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function doGet(request, response) {}

/**
 * Resolves the POST HTTP verb.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function doPost(request, response) {}

/**
 * Resolves the DELETE HTTP verb.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function doDelete(request, response) {}

/**
 * Resolves the PUT HTTP verb.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function doPut(request, response) {}

/**
 * Log a message.
 *
 * @param {Object} context an object containing a message
 */
function log(context) {
    console.log("A message was received: " + context.message);
}

exports.get = doGet;
exports.post = doPost;
exports['delete'] = doDelete;
exports.put = doPut;
exports.log = log;

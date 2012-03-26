/**
 * Resolves the GET HTTP verb.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function doGet(request, response) {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html');
    response.end(t("Email was sent successfully!"));
}

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

exports.get = doGet;
exports.post = doPost;
exports['delete'] = doDelete;
exports.put = doPut;

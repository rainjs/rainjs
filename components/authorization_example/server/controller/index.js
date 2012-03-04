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
function doPost(request, response) {
    // Simulate a login action.
    var session = request.session;
    if (request.body && request.body.user === 'user1') {
        session.user = {
            permissions: ['view_button1', 'view_button2'],
            location: 'US'
        };
    } else if (request.body && request.body.user === 'user2') {
        session.user = {
            permissions: ['view_button1', 'view_button2', 'view_button3'],
            location: 'US'
        };
    } else {
        session.user = undefined;
    }
    response.writeHead(200, {"Content-Type": "application/json"});
    response.end();
}

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
exports.delete = doDelete;
exports.put = doPut;

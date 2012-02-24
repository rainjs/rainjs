/**
 * Resolves the GET HTTP verb.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function doGet(request, response) {
    var data = {
        css: [ '/component/textbox/htdocs/css/index.css' ],
        controller: '/components/textbox/htdocs/controller/index.js',
        domId: 500,
        instanceId : 'b367fd0ee2d8432c202e8af61c288220c420fef3',
        html : ''
    };

    response.writeHead(200, {"Content-Type": "application/jsonp"});
    response.end('clientRenderer.renderComponent('+JSON.stringify(data)+')');
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
exports.delete = doDelete;
exports.put = doPut;

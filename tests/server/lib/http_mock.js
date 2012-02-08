var util = require('util');
var EventEmitter = require('events').EventEmitter;
var serverData = {};

/**
 * The fake client request class that handles the request events
 *
 * @name ClientRequest
 * @constructor
 *
 * @param {Object} the configuration for the request
 * @param {Function} the callback to be called when the request is active
 */
function ClientRequest(options, cb) {
    this.response = new ClientResponse();
    this.emit('response', this.response);
    this.method = options.method.toUpperCase();
    this.path = options.path;
    this.callback = cb;
}
util.inherits(ClientRequest, EventEmitter);

/**
 * Close the request
 *
 * @param {String} data  the data to be sent to the server
 */
ClientRequest.prototype.end = function (data) {
    this.callback(this.response);
    this['handle' + this.method](data);
    this.response.emit('end');
};

/**
 * Handler for requests with the verb PUT
 *
 * @param {String} data data to be handled
 * @private
 */
ClientRequest.prototype.handlePUT = function (data) {
    this.response.data[this.path] = data;
};

/**
 * Handler for requests of the verb GET
 *
 * @private
 */
ClientRequest.prototype.handleGET = function () {
    this.response.emit('data', this.response.data[this.path]);
};

/**
 * The response recived from the server after a succesfull request
 *
 * @name ClientResponse
 * @constructor
 */
function ClientResponse() {
    this.header = {};
    this.httpVersion = '1.1';
    this.statusCode = 200;
    this.data = {};
}
util.inherits(ClientResponse, EventEmitter);

/**
 * Set he encoding for the current request
 *
 * @param {String} encoding the encoding to be set (default: 'utf8')
 */
ClientResponse.prototype.setEncoding = function (encoding) {
    if(!encoding) {
        this.encoding = 'utf8';
    }
};

module.exports = ClientRequest;

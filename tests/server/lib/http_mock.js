// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

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

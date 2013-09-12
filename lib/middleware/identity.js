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

'use strict';

var Environment = require('../environment'),
    IdentityProvider = require('../security').IdentityProvider;

var SESSION_ROUTES = ['controller', 'view'];

/**
 * @name Identity
 * @namespace
 */
/**
 * Adds environment, idp and user to the request
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Function} next callback passed by connect
 * @memberOf Identity
 */
function identity(request, response, next) {
    if (!request.rainRoute || SESSION_ROUTES.indexOf(request.rainRoute.routeName) === -1) {
        next();
        return;
    }

    request.environment = new Environment(request.globalSession);
    request.idp = IdentityProvider.get(request.globalSession);
    request.user = request.idp.getUser();

    var end = response.end;

    response.end = function (data, encoding) {
        response.end = end;

        request.idp.updateUser();

        response.end(data, encoding);
    };

    next();
}

module.exports = function () {
    return identity;
};

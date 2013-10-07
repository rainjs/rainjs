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

"use strict";

function handleHttpMethods(request, response, next) {
    var supportedMethods = ['GET', 'HEAD', 'POST', 'TRACE', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
    var isSupportedMethod = (supportedMethods.indexOf(request.method) !== -1);
    var isTrace = (request.method === 'TRACE');

    if (!isSupportedMethod) {
        response.statusCode = 501;
        response.setHeader('Content-Type', 'text/html');
        response.end("Not implemented");
        return;
    }

    if (isTrace) {
        var chunk = '';
        request.on('data', function (buff) {
            chunk += buff.toString('utf8');
        });

        request.on('end', function (buff) {
            if (buff) {
                chunk += buff.toString('utf8');
            }

            response.statusCode = 200;

            var accept = request.headers.accept || '';
            if (accept.indexOf('text/html') !== -1) {
                response.setHeader('Content-Type', 'text/html');
            } else {
                response.setHeader('Content-Type', 'text/plain');
            }

            response.write(chunk);
            response.end();
        });
        return;
    };

    next();
}

module.exports = function () {
    return handleHttpMethods;
};

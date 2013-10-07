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

describe('HandleHttpMethods', function () {
    var handleRequestType,
        mocks,
        request,
        response,
        next,
        requestFn;

    beforeEach(function() {

        request = {
            'headers': {},
            'method': '',
            'on': function(eventName, callback) {
                 requestFn = callback;
            }
        };

        response = {
            'on': function(eventName, callback) {},
            'setHeader': jasmine.createSpy(),
            'write': jasmine.createSpy(),
            'end': jasmine.createSpy()
        };

        next = jasmine.createSpy();

    });

    handleRequestType = loadModuleExports('/lib/middleware/handleHttpMethods.js', mocks);

    describe('Acting correctly when requests not supported by 1and1 are received', function() {

        it('should set response statusCode to 501', function() {
            request.method = 'CONNECT';
            handleRequestType()(request, response, next);
            expect(response.statusCode).toEqual(501);

            request.method = 'get';
            handleRequestType()(request, response, next);
            expect(response.statusCode).toEqual(501);

            expect(next).not.toHaveBeenCalled();
        });

        it('should call response.end()', function() {
            request.method = 'CONNECT';
            handleRequestType()(request, response, next);
            expect(response.end).toHaveBeenCalled();

            request.method = 'post';
            handleRequestType()(request, response, next);
            expect(response.end).toHaveBeenCalled();

            expect(next).not.toHaveBeenCalled();
        });

    });

    describe('Acting correctly when a trace request is received', function() {
        it('should set statusCode to 200', function() {
            request.method = 'TRACE';
            handleRequestType()(request, response, next);
            requestFn();
            expect(response.statusCode).toEqual(200);

            expect(next).not.toHaveBeenCalled();
        });

        it('should respond back', function() {
            request.method = 'TRACE';
            handleRequestType()(request, response, next);
            requestFn();
            expect(response.write).toHaveBeenCalled();
            expect(response.end).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

    });

    describe('Acting correctly when requests with a supported method is received', function() {
        it('should not attach a status code', function() {
            request.method = 'GET';
            handleRequestType()(request, response, next);
            expect(response.statusCode).not.toEqual(501);

            request.method = 'OPTIONS';
            handleRequestType()(request, response, next);
            expect(response.statusCode).not.toEqual(501);

        });

        it('should call next', function() {
            request.method = 'OPTIONS';
            handleRequestType()(request, response, next);
            expect(response.statusCode).not.toEqual(501);
            expect(response.statusCode).not.toEqual(200);

            expect(next).toHaveBeenCalled();
        });

    });

});

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

var globals = require(process.cwd() + '/lib/globals');
var authorization = require(process.cwd() + '/lib/authorization');

describe('Authorization: permissions and dynamic conditions', function () {
    var securityContext = null;

    beforeEach(function () {
        securityContext = {
            user: {
                country: 'US',
                hasPermissions: jasmine.createSpy('hasPermissions'),
                isAuthenticated: jasmine.createSpy('isAuthenticated')
            }
        };

        securityContext.user.isAuthenticated.andReturn(true);
    });

    it('should throw an error when permissions key is not an array', function () {
        expect(function() {
            authorization.authorize(securityContext);
        }).toThrow('precondition failed: permissions key is not an array.');
    });

    it('should throw an error when dynamicConditions key is not an array', function () {
        expect(function() {
            authorization.authorize(securityContext, [], undefined);
        }).toThrow('precondition failed: dynamicConditions key is not an array.');
    });

    it('should pass permissions check', function () {
       securityContext.user.hasPermissions.andReturn(true);

       var isAuthorized = authorization.authorize(securityContext, ['perm2', 'perm3'], []);

       expect(isAuthorized).toBe(true);
       expect(securityContext.user.hasPermissions).toHaveBeenCalledWith(['perm2', 'perm3']);
    });

    it('should not pass permissions check', function () {
        securityContext.user.hasPermissions.andReturn(false);

        var isAuthorized = authorization.authorize(securityContext, ['perm2', 'perm4'], []);

        expect(isAuthorized).toBe(false);
        expect(securityContext.user.hasPermissions).toHaveBeenCalledWith(['perm2', 'perm4']);
     });

    it('should pass dynamic conditions check', function () {
        securityContext.user.hasPermissions.andReturn(true);

        var isAuthorized = authorization.authorize(securityContext, [],
            [function () { return true; },
             function () { return true; }]
        );

        expect(isAuthorized).toBe(true);
     });

     it('should not pass dynamic conditions check', function () {
         securityContext.user.hasPermissions.andReturn(true);

         var isAuthorized = authorization.authorize(securityContext, [],
             [function () { return true; },
              function () { return false; }]
         );

         expect(isAuthorized).toBe(false);
      });

     it('should be authorized (permissions + dynamic conditions)', function () {
         securityContext.user.hasPermissions.andReturn(true);

         var isAuthorized = authorization.authorize(securityContext, ['perm2', 'perm3'],
             [function () { return true; },
              function () { return true; }]
         );

         expect(isAuthorized).toBeTruthy();
         expect(securityContext.user.hasPermissions).toHaveBeenCalledWith(['perm2', 'perm3']);
     });

     it('should be forbidden (permissions + dynamic conditions)', function () {
         securityContext.user.hasPermissions.andReturn(true);

         var isAuthorized = authorization.authorize(securityContext, ['perm2', 'perm3'],
             [function () { return true; },
              function () { return false; }]
         );

         expect(isAuthorized).toBe(false);
         expect(securityContext.user.hasPermissions).toHaveBeenCalledWith(['perm2', 'perm3']);
     });

     it('should not execute dynamic conditions when permissions check fails', function () {
         securityContext.user.hasPermissions.andReturn(false);
         var isExecuted = false;

         authorization.authorize(securityContext, ['perm2', 'perm4'],
                 [function () { isExecuted = true; return true; },
                  function () { isExecuted = true; return false; }]
         );

         expect(isExecuted).toBe(false);
     });

     it('should be authorized when dynamic conditions require user to have US country', function () {
         securityContext.user.hasPermissions.andReturn(true);
         var dynamicCondition = function (context) {
             return context.user.country === 'US';
         };

         var isAuthorized = authorization.authorize(securityContext, [], [dynamicCondition]);

         expect(isAuthorized).toBe(true);
     });

     it('should be forbidden when dynamic conditions require user to have RO country', function () {
         securityContext.user.hasPermissions.andReturn(true);
         var dynamicCondition = function (context) {
             return context.user.country === 'RO';
         };

         var isAuthorized = authorization.authorize(securityContext, [], [dynamicCondition]);

         expect(isAuthorized).toBe(false);
     });
});

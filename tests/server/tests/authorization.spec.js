"use strict";

var globals = require(process.cwd() + '/lib/globals');
var authorization = require(process.cwd() + '/lib/authorization');

describe('Authorization: permissions and dynamic conditions', function () {
    var securityContext = null;

    beforeEach(function () {
        securityContext = {
            user: {
                permissions: ['perm1', 'perm2', 'perm3'],
                country: 'US'
            }
        };
    });

    it('must throw an error when permissions key is not an array', function () {
        expect(function() {
            authorization.authorize(securityContext);
        }).toThrow('precondition failed: permissions key is not an array.');
    });

    it('must throw an error when dynamicConditions key is not an array', function () {
        expect(function() {
            authorization.authorize(securityContext, [], undefined);
        }).toThrow('precondition failed: dynamicConditions key is not an array.');
    });

    it('must pass permissions check', function () {
       var isAuthorized = authorization.authorize(securityContext, ['perm2', 'perm3'], []);
       expect(isAuthorized).toBe(true);
    });

    it('must not pass permissions check', function () {
        var isAuthorized = authorization.authorize(securityContext, ['perm2', 'perm4'], []);
        expect(isAuthorized).toBe(false);
     });

    it('must pass dynamic conditions check', function () {
        var isAuthorized = authorization.authorize(securityContext, [],
            [function () { return true; },
             function () { return true; }]
        );
        expect(isAuthorized).toBe(true);
     });

     it('must not pass dynamic conditions check', function () {
         var isAuthorized = authorization.authorize(securityContext, [],
             [function () { return true; },
              function () { return false; }]
         );
         expect(isAuthorized).toBe(false);
      });

     it('must be authorized (permissions + dynamic conditions)', function () {
         var isAuthorized = authorization.authorize(securityContext, ['perm2', 'perm3'],
             [function () { return true; },
              function () { return true; }]
         );
         expect(isAuthorized).toBeTruthy();
     });

     it('must be forbidden (permissions + dynamic conditions)', function () {
         var isAuthorized = authorization.authorize(securityContext, ['perm2', 'perm3'],
             [function () { return true; },
              function () { return false; }]
         );
         expect(isAuthorized).toBe(false);
     });

     it('must not execute dynamic conditions when permissions check fails', function () {
         var isExecuted = false;
         authorization.authorize(securityContext, ['perm2', 'perm4'],
                 [function () { isExecuted = true; return true; },
                  function () { isExecuted = true; return false; }]
         );
         expect(isExecuted).toBe(false);
     });

     it('must be authorized when dynamic conditions require user to have US country', function () {
         var dynamicCondition = function (context) {
             return context.user.country === 'US';
         };
         var isAuthorized = authorization.authorize(securityContext, [], [dynamicCondition]);
         expect(isAuthorized).toBe(true);
     });

     it('must be forbidden when dynamic conditions require user to have RO country', function () {
         var dynamicCondition = function (context) {
             return context.user.country === 'RO';
         };
         var isAuthorized = authorization.authorize(securityContext, [], [dynamicCondition]);
         expect(isAuthorized).toBe(false);
     });
});

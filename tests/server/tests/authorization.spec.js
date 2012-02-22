var mod_authorization = require(process.cwd() + '/lib/authorization.js');

describe('Authorization: permissions and dynamic conditions', function () {
    var securityContext;

    beforeEach(function () {
        securityContext = {
            user: {
                permissions: ['perm1', 'perm2', 'perm3'],
                country: 'US'
            }
        };
    });

    it('should throw an error when permissions key is not an array', function () {
        expect(function() {
            mod_authorization.authorize(securityContext);
        }).toThrow('precondition failed: permissions key is not an array.');
    });

    it('should throw an error when dynamicConditions key is not an array', function () {
        expect(function() {
            mod_authorization.authorize(securityContext, [], undefined);
        }).toThrow('precondition failed: dynamicConditions key is not an array.');
    });

    it('should pass permissions check', function () {
       var isAuthorized = mod_authorization.authorize(securityContext, ['perm2', 'perm3'], []);
       expect(isAuthorized).toBe(true);
    });

    it('should not pass permissions check', function () {
        var isAuthorized = mod_authorization.authorize(securityContext, ['perm2', 'perm4'], []);
        expect(isAuthorized).toBe(false);
     });

    it('should pass dynamic conditions check', function () {
        var isAuthorized = mod_authorization.authorize(securityContext, [],
            [function () { return true; },
             function () { return true; }]
        );
        expect(isAuthorized).toBe(true);
     });

     it('should not pass dynamic conditions check', function () {
         var isAuthorized = mod_authorization.authorize(securityContext, [],
             [function () { return true; },
              function () { return false; }]
         );
         expect(isAuthorized).toBe(false);
      });

     it('should be authorized (permissions + dynamic conditions)', function () {
         var isAuthorized = mod_authorization.authorize(securityContext, ['perm2', 'perm3'],
             [function () { return true; },
              function () { return true; }]
         );
         expect(isAuthorized).toBeTruthy();
     });

     it('should be forbidden (permissions + dynamic conditions)', function () {
         var isAuthorized = mod_authorization.authorize(securityContext, ['perm2', 'perm3'],
             [function () { return true; },
              function () { return false; }]
         );
         expect(isAuthorized).toBe(false);
     });

     it('should not execute dynamic conditions when permissions check fails', function () {
         var isExecuted = false;
         mod_authorization.authorize(securityContext, ['perm2', 'perm4'],
                 [function () { isExecuted = true; return true; },
                  function () { isExecuted = true; return false; }]
         );
         expect(isExecuted).toBe(false);
     });

     it('should be authorized when dynamic conditions require user to have US country', function () {
         var dynamicCondition = function (context) {
             return context.user.country === 'US';
         };
         var isAuthorized = mod_authorization.authorize(securityContext, [], [dynamicCondition]);
         expect(isAuthorized).toBe(true);
     });

     it('should be forbidden when dynamic conditions require user to have RO country', function () {
         var dynamicCondition = function (context) {
             return context.user.country === 'RO';
         };
         var isAuthorized = mod_authorization.authorize(securityContext, [], [dynamicCondition]);
         expect(isAuthorized).toBe(false);
     });
});

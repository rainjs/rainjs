var mod_authorization = require(process.cwd() + '/lib/authorization.js');

describe('authorization', function () {
    var securityContext;
    
    beforeEach(function () {
        securityContext = {
            user: {
                permissions: ['perm1', 'perm2', 'perm3'],
                country: 'US'
            }
        };
    });
    
    it('should pass permissions check', function () {
       var isAuthorized = mod_authorization.authorize(securityContext, ['perm2', 'perm3'], []); 
       expect(isAuthorized).toBeTruthy();
    });
    
    it('should not pass permissions check', function () {
        var isAuthorized = mod_authorization.authorize(securityContext, ['perm2', 'perm4'], []); 
        expect(isAuthorized).toBeFalsy();
     });
    
    it('should pass dynamic conditions check', function () {
        var isAuthorized = mod_authorization.authorize(securityContext, [], 
            [function () { return true; }, 
             function () { return true; }]
        ); 
        expect(isAuthorized).toBeTruthy();
     });
     
     it('should not pass dynamic conditions check', function () {
         var isAuthorized = mod_authorization.authorize(securityContext, [], 
             [function () { return true; }, 
              function () { return false; }]
         ); 
         expect(isAuthorized).toBeFalsy();
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
         expect(isAuthorized).toBeFalsy();
     });
     
     it('should not execute dynamic conditions when permissions check fails', function () {
         var isExecuted = false; 
         mod_authorization.authorize(securityContext, ['perm2', 'perm4'], 
                 [function () { isExecuted = true; return true; }, 
                  function () { isExecuted = true; return false; }]
         );
         expect(isExecuted).toBeFalsy();
     });
});
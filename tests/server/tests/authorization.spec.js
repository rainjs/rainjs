var mod_authorization = require(process.cwd() + '/lib/authorization.js');

describe('authorization', function () {
    it('should be authorized', function () {
       var isAuthorized = mod_authorization.authorize(['perm1', 'perm2', 'perm3'], ['perm2', 'perm3']); 
       expect(isAuthorized).toBeTruthy();
    });
    
    it('should be forbidden', function () {
        var isAuthorized = mod_authorization.authorize(['perm1', 'perm2'], ['perm2', 'perm3']); 
        expect(isAuthorized).toBeFalsy();
     });
});
/**
 * Checks if an user is allowed to access a resource
 * 
 * @param {Array} userPermissions the permissions of the user
 * @param {Array} requiredPermissions the permissions required to access a resource
 * @returns {Boolean} the result of the permission checks
 */

function authorize(securityContext, permissions, dynamicConditions) {    
    if (!securityContext.user) {
        //the current user isn't authenticated
        return permissions.length === 0 && dynamicConditions.length === 0;
    }
    
    var isAuthorized = checkPermissions(securityContext, permissions);
    if (!isAuthorized) {
        return false;
    }
    
    return checkDynamicConditions(securityContext, dynamicConditions);
}

function checkPermissions(securityContext, permissions) {
    var userPermissions = securityContext.user.permissions;
    
    for (var i = 0, len1 = permissions.length; i < len1; i++) {
        var permission = permissions[i]; 
        var hasPermissions = false;
        
        for (var j = 0, len2 = userPermissions.length; j < len2; j++) {
            if (userPermissions[j] === permission) {
                hasPermissions = true;
                break;
            }
        }
        
        if (!hasPermissions) {
            return false;
        }        
    }
    
    return true;    
}

function checkDynamicConditions(securityContext, dynamicConditions) {
    for (var i = 0, len = dynamicConditions.length; i < len; i++) {
        var isAuthorized = dynamicConditions[i](securityContext);
        if (!isAuthorized) {
            return false;
        }
    }
    
    return true;
}

module.exports = {
    authorize: authorize
};
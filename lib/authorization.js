/**
 * Checks if an user has the required permissions to access a resource
 * 
 * @param {Array} userPermissions the permissions of the user
 * @param {Array} requiredPermissions the permissions required to access a resource
 * @returns {Boolean} the result of the permission checks
 */
function authorize(userPermissions, requiredPermissions) {
    for (var i = 0, len1 = requiredPermissions.length; i < len1; i++) {
        var permission = requiredPermissions[i]; 
        var hasPermissions = false;
        
        for (var j = 0, len2 = userPermissions.length; j < len2; j++) {
            if (userPermissions[i] === permission) {
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

exports {
    authorize: authorize
};
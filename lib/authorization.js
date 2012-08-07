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

var util = require('./util');

/**
 * Provides methods that validate the user's permissions against the defined authorization rules
 *
 * @name Authorization
 * @namespace
 */

/**
 * Checks if an user is allowed to access a resource.
 *
 * @param {Object} securityContext the security context
 * @param {Object} securityContext.user the user to authorize
 * @param {Array} permissions the permissions required to access a resource
 * @param {Array} dynamicConditions the dynamic conditions to execute
 * @returns {Boolean} the result of the authorization checks
 * @memberOf Authorization
 */
function authorize(securityContext, permissions, dynamicConditions) {
    if (!util.isArray(permissions)) {
        throw new Error('precondition failed: permissions key is not an array.');
    }

    if (!util.isArray(dynamicConditions)) {
        throw new Error('precondition failed: dynamicConditions key is not an array.');
    }

    if (!securityContext.user.isAuthenticated()) {
        // The current user isn't authenticated.
        return permissions.length === 0 && dynamicConditions.length === 0;
    }

    return checkPermissions(securityContext, permissions) &&
        checkDynamicConditions(securityContext, dynamicConditions);
}

/**
 * Checks if an user has the permissions to access the resource.
 *
 * @param {Object} securityContext the security context
 * @param {Object} securityContext.user the user to authorize
 * @param {Array} permissions the permissions required to access a resource
 * @returns {Boolean} wether the user is allowed to access the page
 * @memberOf Authorization
 * @private
 */
function checkPermissions(securityContext, permissions) {
    return securityContext.user.hasPermissions(permissions);
}

/**
 * Checks if the dynamic conditions are passing.
 *
 * @param {Object} securityContext the security context
 * @param {Object} securityContext.user the user to authorize
 * @param {Array} dynamicConditions the dynamic conditions to execute
 * @returns {Boolean} the result of the dynamic conditions check
 * @memberOf Authorization
 * @private
 */
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

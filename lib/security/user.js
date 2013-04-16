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

/**
 * Provides a basic implementation of the user class. It can serve as a base class for a custom user
 * implementation if additional fields or methods are needed.
 *
 * @name User
 * @param {Object|User} obj contains the data used to initialize an user.
 * @param {String} obj.id the user id
 * @param {String} obj.username the username
 * @param {String[]} obj.permissions the permissions associated with this user
 * @class Creates an user. If the object passed as parameter is an user instance returns the instance.
 */
function User(obj) {
    if (obj instanceof User) {
        return obj;
    }

    this._isAuthenticated = false;
    this._isDirty = false;

    if (typeof obj !== 'undefined') {
        this._id = obj.id;
        this._username = obj.username;
        this._permissions = obj.permissions;
        this._isAuthenticated = true;
    }
}

/**
 * Gets the user id.
 * @name id
 * @memberOf User#
 * @type {String}
 */
Object.defineProperty(User.prototype, 'id', {get: function () {
    return this._id;
}});

/**
 * Gets the username.
 * @name username
 * @memberOf User#
 * @type {String}
 */
Object.defineProperty(User.prototype, 'username', {get: function () {
    return this._username;
}});

/**
 * Checks if an user has the requested permissions.
 *
 * @param {String[]} permissions the permissions to be verified against the current user
 * @returns {Boolean} the result of the permission check
 */
User.prototype.hasPermissions = function (permissions) {
    var userPermissions = this._permissions || [];

    for (var i = 0, len1 = permissions.length; i < len1; i++) {
        var permission = permissions[i];
        var hasPermission = false;

        for (var j = 0, len2 = userPermissions.length; j < len2; j++) {
            if (userPermissions[j] === permission) {
                hasPermission = true;
                break;
            }
        }

        if (!hasPermission) {
            return false;
        }
    }

    return true;
};

/**
 * Returns true for authenticated users and false for anonymous users.
 * @returns {Boolean} the authentication status for the current user
 */
User.prototype.isAuthenticated = function () {
    return this._isAuthenticated;
};

/**
 * Indicates if an user was modified.
 *
 * @returns {Boolean}
 */
User.prototype.isDirty = function () {
    return this._isDirty;
};

/**
 * Overrides the toJSON method in order to return a correct JSON representation for the
 * user object.
 * @returns {Object} the object to be serialized to JSON
 */
User.prototype.toJSON = function () {
    return {
        id: this._id,
        username: this._username,
        permissions: this._permissions
    };
};

module.exports = User;

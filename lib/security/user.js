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

function User(obj) {
    if (obj instanceof User) {
        return obj;
    }

    this._isAuthenticated = false;

    if (typeof obj !== 'undefined') {
        this._id = obj.id;
        this._username = obj.username;
        this._permissions = obj.permissions;
        this._isAuthenticated = true;
    }
}

Object.defineProperty(User.prototype, 'id', {get: function () {
    return this._id;
}});

Object.defineProperty(User.prototype, 'username', {get: function () {
    return this._username;
}});

/*Object.defineProperty(User.prototype, 'permissions', {get: function () {
    return this._permissions;
}});*/

/*User.prototype.id = function () {
    return this._id;
};

User.prototype.name = function () {
    return this._name;
};

User.prototype.permissions = function () {
    return this._permissions;
};*/

/**
 * I think this is more useful than a getter for permissions. Probably the getter should
 * be removed.
 *
 * @param {String[]} permissions
 * @returns {Boolean}
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

User.prototype.isAuthenticated = function () {
    return this._isAuthenticated;
};

User.prototype.toJSON = function () {
    return JSON.stringify(this._serialize());
};

User.prototype._serialize = function () {
    return {
        id: this._id,
        name: this._username,
        permissions: this._permissions
    };
};

module.exports = User;

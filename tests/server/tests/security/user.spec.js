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

describe('User', function () {
    var User, user, anonymous;

    beforeEach(function () {
        User = loadModuleExports('/lib/security/user.js');

        user = new User({
            id: '1234',
            username: 'test',
            permissions: ['perm1', 'perm2', 'perm3']
        });

        anonymous = new User();
    });

    it('should return the user id', function () {
        expect(user.id).toEqual('1234');
        expect(anonymous.id).toBeUndefined();
    });

    it('should return the username', function () {
        expect(user.username).toEqual('test');
        expect(anonymous.username).toBeUndefined();
    });

    it('should check user permissions', function () {
        expect(user.hasPermissions(['perm1'])).toEqual(true);
        expect(user.hasPermissions(['perm1', 'perm3'])).toEqual(true);
        expect(user.hasPermissions(['perm1', 'perm2', 'perm3'])).toEqual(true);
        expect(user.hasPermissions(['perm3', 'perm2'])).toEqual(true);

        expect(user.hasPermissions(['perm1', 'perm2', 'perm4', 'perm3'])).toEqual(false);
        expect(user.hasPermissions(['perm5'])).toEqual(false);

        expect(user.hasPermissions([])).toEqual(true);
        expect(anonymous.hasPermissions([])).toEqual(true);

        expect(anonymous.hasPermissions(['any'])).toEqual(false);
    });

    it('should tell if the user is authenticated', function () {
        expect(user.isAuthenticated()).toEqual(true);
        expect(anonymous.isAuthenticated()).toEqual(false);
    });

    it('should serialize to JSON', function () {
        expect(JSON.stringify(user))
            .toEqual('{"id":"1234","username":"test","permissions":["perm1","perm2","perm3"]}');
        expect(JSON.stringify(anonymous)).toEqual('{}');
    });
});
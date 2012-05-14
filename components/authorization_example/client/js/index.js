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

define(["authorization_example/js/jquery-ui-1.8.16.custom.min"], function() {
    /**
     * Creates a AuthorizationExample component instance.
     *
     * @name AuthorizationExample
     * @class AuthorizationExample controller class
     * @constructor
     */
    function AuthorizationExample() {
        // constructor logic here
    }

    /**
     * Initialization lifecycle step that happens immediately after the controller is loaded.
     *
     * @function
     */
    AuthorizationExample.prototype.init = $.noop;

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     *
     * Find user links and simulate login behavior.
     */
    AuthorizationExample.prototype.start = function () {
        var self = this;
        var root = this.context.getRoot();
        root.find('#nouser').button().click(function (event) {
            simulateUserLogin(self, 'nouser');
        });
        root.find('#user1').button().click(function (event) {
            simulateUserLogin(self, 'user1');
        });
        root.find('#user2').button().click(function (event) {
            simulateUserLogin(self, 'user2');
        });
    };

    /**
     * Simulates a login action by making a post to a server-side controller that stores
     * mocked information about a logged user.
     *
     * @param {AuthorizationExample} self the class instance
     * @param {String} userId the user id
     * @memberOf AuthorizationExample#
     */
    function simulateUserLogin(self, userId) {
        var data = {user: userId};
        $.ajax({
            url: '/authorization_example/1.0/controller/index',
            type: 'POST',
            dataType: 'json',
            data: data,
            async: false,
            success: function (result) {
                // Redirect to the page where we can see the authorization state for the current
                // logged user.
                self.context.replace({
                    id: "authorization_example",
                    view: "buttons",
                    placeholder: false
                });
            }
        });
        return false;
    }

    return AuthorizationExample;
});

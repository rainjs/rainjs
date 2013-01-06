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

define([], function (t, nt) {

    /**
     * Example controller class for identity providers.
     *
     * @name LoginExample
     * @class
     * @constructor
     */
    function LoginExample() {}

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    LoginExample.prototype.start = function () {
        var root = this.context.getRoot(),
            username = root.find('input[name="username"]'),
            password = root.find('input[name="password"]'),
            login = root.find('button');

        username.focus();

        login.click(function () {
            $.ajax({
                url: '/example/controller/login',
                type: 'POST',
                dataType: 'json',
                data: {
                    username: username.val(),
                    password: password.val()
                },
                success: function (data) {
                    if ('error' in data) {
                        alert(t('Login failed.'));
                    } else if (data.success) {
                        window.location.href = window.location.href;
                    }
                },
                error: function () {
                    alert(t('Login failed.'));
                }
            });
        });
    };

    return LoginExample;
});

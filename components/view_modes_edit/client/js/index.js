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

define(['raintime/messaging/sockets',
        'raintime/inline_editing'
], function (Sockets, InlineEditing) {

    /**
     * This component lets the user change the current editing language (from the list of languages
     * that he has permissions to translate) and perform other inline editing operations.
     *
     * @name ViewModesEdit
     * @class
     * @constructor
     */
    function ViewModesEdit() {}

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    ViewModesEdit.prototype.start = function () {
        var select = this.context.getRoot().find('.languages'),
            editActions = this.context.getRoot().find('.actions'),
            socket = Sockets.getSocket('/core');

        select.change(function (event) {
            if (socket.socket.connected) {
                var language = select.val();
                socket.emit('change_language', language, function (error) {
                    window.location.href = window.location.href;
                });
            }
        });

        editActions.change(function (event) {
            var value = editActions.val(),
                result;

            switch (value) {
                case '':
                    return;
                case '1':
                    InlineEditing.refreshTranslationPlaceholders();
                    break;
                case '2':
                    InlineEditing.disableEditEvents();
                    break;
                case '3':
                    InlineEditing.enableEditEvents();
                    break;
                case '4':
                    result = InlineEditing.removeInlineTranslations();
                    break;
                default:
                    break;
            }

            if (result && result.then) {
                result.then(function () {
                    editActions.val('');
                }, function () {});
            } else {
                editActions.val('');
            }
        });
    };

    return ViewModesEdit;
});

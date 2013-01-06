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

define(['raintime/messaging/sockets'], function (Sockets) {

    /**
     * The view modes component provides a way to change the view mode state. Currently
     * there are only two modes available: the "normal" view mode and the "edit" translations view
     * mode (used for inline editing).
     *
     * The page is refreshed after the view mode changed.
     *
     * To make the "edit" mode available, the server configuration file has to have the proper
     * settings for the "view_modes" parameter.
     *
     * @name ViewModes
     * @class
     * @constructor
     */
    function ViewModes() {}

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    ViewModes.prototype.start = function () {
        var modesSelector = this.context.getRoot().find('.modes'),
            socket = Sockets.getSocket('/core');

        modesSelector.change(function (event) {
            if (socket.socket.connected) {
                var viewMode = modesSelector.val();
                socket.emit('change_view_mode', viewMode, function (error) {
                    window.location.href = window.location.href;
                });
            }
        });
    };

    return ViewModes;
});

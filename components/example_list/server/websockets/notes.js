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

var Promise = require('promised-io/promise');
var defer = Promise.defer;

function handle(socket) {
    socket.on('save', function (data) {
        var notes = socket.session.get('notes');
        if (!notes) {
            notes = [];
        }

        notes[data.index] = data.note;
        socket.session.set('notes', notes);
    });

    socket.on('save-list', function (list) {
        var notes = socket.session.get('notes');
        if (!notes) {
            notes = [];
        }

        for(var index in list) {
            notes[index] = list[index].note;
        }
        socket.session.set('notes', notes);
    });

    socket.on('remove', function (data) {
        var notes = socket.session.get('notes');
        if (notes) {
            notes.splice(data.index, 1);
            socket.session.set('notes', notes);
        }
    });

    var notes = socket.session.get('notes');
    socket.emit('info', {
        size: notes ? notes.length : 0
    });

    logger.info(t('The user "%1$s" connected to the notes websocket.',
                  socket.user && socket.user.username || 'Guest'));
}

module.exports = {
    channel: 'notes',
    handle: handle
};

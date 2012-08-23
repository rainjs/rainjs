"use strict";

function handle(socket) {
    socket.on('save', function (data, end) {
        var notes = socket.session.get('notes');
        if (!notes) {
            notes = [];
        }

        notes[data.index] = data.note;
        socket.session.set('notes', notes);
        end();
    });

    socket.on('remove', function (data, end) {
        var notes = socket.session.get('notes');
        if (notes) {
            notes.splice(data.index, 1);
            socket.session.set('notes', notes);
            end();
        }
    });
}

module.exports = {
    channel: 'notes',
    handle: handle
};

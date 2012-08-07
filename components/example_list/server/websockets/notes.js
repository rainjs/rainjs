function handle(socket) {
    socket.on('save', function (data) {
        if (!socket.session.notes) {
            socket.session.notes = [];
        }

        socket.session.notes[data.index] = data.note;
    });

    socket.on('remove', function (data) {
        if (socket.session.notes) {
            socket.session.notes.splice(data.index, 1);
        }
    });
}

module.exports = {
    channel: 'notes',
    handle: handle
};

function handle(socket) {
    socket.on('save', function (data) {
        if (!socket.session.notes) {
            socket.session.notes = [];
        }

        socket.session.notes[data.index] = data.note;
    });
}

module.exports = {
    channel: 'notes',
    handle: handle
};

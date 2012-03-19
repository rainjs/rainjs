function handle(socket) {
    socket.emit('hello', {message: 'Hello Sockets!'});
};

module.exports = {
    channel: 'button',
    handle: handle
};

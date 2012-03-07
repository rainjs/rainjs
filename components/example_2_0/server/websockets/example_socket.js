function handle(socket) {
    socket.emit('hello', {message: 'Hello Sockets!'});
    console.log(socket.session)
};

module.exports = {
    channel: 'example',
    handle: handle
};

function handle(socket) {
    socket.emit('hello', {message: 'Hello Sockets!'});
}

module.exports = {
    channel: 'example',
    handle: handle
}

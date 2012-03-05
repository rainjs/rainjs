function handler(socket) {
    socket.emit('hello', {message: 'Hello Sockets!'});
}

module.exports = {
    channel: 'example',
    handler: handler
}

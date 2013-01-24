===============
RAIN Websockets
===============

RAIN aims to make new HTML5 specification accessible to user and also to provide graceful
degradation where necessary. Websockets are one of the coolest addition of HTML 5 and opens
a new perspective in web development.

Do not understand this wrong: P2P connections are still not possible. Also it is worth
mentioning that work on websocket from HTML 5 is not finalized yet.

-------------------------
RAIN Websockets Interface
-------------------------

In RAIN is really easy to use websockets. You don't even have to care about browser compatibility
because this is automatically provided by socket.io (the underlining framework used for websockets).

Each websocket you define must provide a handle method::

    function handle(socket) {
        socket.emit('hello', {message: 'Hello Sockets!'});
    };

In RAIN websockets are auto-discovered for each registered component. All you have to do is place
your socket handlers under the ``websockets`` folder of your component root.

Lets take a really simple example from the chat component::

    /chat
        /server
            /websockets
                /chat.js
        /client

And now the chat handler code::

    function handle(socket) {
        socket.emit('hello', {message: 'Hello Sockets!'});

        socket.on('new-message', function (data) {
            console.log(data.text);
        });
    };

    module.exports = {
        channel: 'chat',
        handle: handle
    };

At registration time, RAIN will map the socket handler automatically. To see how to use the sockets
on the client side see: :doc:`/client/websockets`.

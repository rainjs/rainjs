===============
RAIN Websockets
===============

RAIN aims to make new HTML5 specification accessible to user and also to provide graceful
degradation where necessary. Websockets are one of the coolest addition of HTML 5 and open
a new perspective in web development.

Do not understand this wrong: P2P connections are still not possible. Also it is worth
mentioning that work on websocket from HTML 5 is not finalized yet. In RAIN it is
really easy to use websockets.

-------------------------
RAIN Websockets Interface
-------------------------

In RAIN is really easy to use websockets. You don't even have to care about browser compatibility
because this is automatically provided by socket.io (the underlining framework used for websockets).

Each websocket you define must provide a handle method::

    function handle(socket) {
        socket.emit('hello', {message: 'Hello Sockets!'});
    };

In RAIN websockets are autodiscovered for each registered component. All you have to do
is to place your socket handlers under websockets folder of your component root.

Lets take a really simple example from example component::

    /intents_example
        /server
            /websockets
                /dummy_socket_handler.js
        /client

And now the dummy_socket_handler code::

    function handle(socket) {
        socket.emit('hello', {message: 'Hello Sockets!'});
    };

    module.exports = {
        channel: 'example',
        handle: handle
    };

At registration time, RAIN will map the socket handler automatically. This will become accesible
to: http://<rain_server>:<sockets_port>/example;1.0/example

As you can see subfolders are used to create a namespace for the websocket within the module
while value returned by getSocketName is used as the real name of the socket.

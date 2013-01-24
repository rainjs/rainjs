===============
RAIN Websockets
===============

RAIN aims to make new HTML5 specification accessible to user and also to provide graceful
degradation where necessary. Websockets are one of the coolest addition of HTML 5 and opens
a new perspective in web development.

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
            socket.session.set('data', data);
        });
    };

    module.exports = {
        channel: 'chat',
        handle: handle
    };

At registration time, RAIN will map the socket handler automatically. To see how to use the sockets
on the client side see: :doc:`/client/websockets`.

This module will send and receive messages on the ``chat`` channel. Multiple components can
safely use the same channel name because the channel name is also prefixed with the component
id and version.

The session is exposed using the ``session`` property of the socket object both in the handle
method and in each event listener. The session is automatically saved after you code executes.
You can delay the session save by returning a promise and resolving it after you set the needed
data on the session::

    function handle(socket) {
        socket.on('data', function (data) {
            var deferred = defer();

            process.nextTick(function () {
                socket.session.set('data', data);
                deferred.resolve();
            });

            return deferred.promise;
        });
    }

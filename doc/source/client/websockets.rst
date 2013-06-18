==========================
Client side websockets API
==========================

In RAIN you can easily access websockets that are defined in RAIN components. As described
in page :doc:`/server/websockets`, websockets in RAIN have a well defined model and are
auto discovered for each component. During autodiscovery process the web sockets handlers
receive a channel and they are registered at a certain url.

On the client side, to be able to connect to a websocket you need to specify the channel. In
RAIN the client runtime provides easy access to websockets.

Below you can find a simple example of how to obtain a websocket connection for this case:

.. code-block:: javascript

   this._socket = this.context.messaging.getSocket(channel);

After you obtain a connection to this websocket you can easily start to emit messages and
react to messages. The obtained socket is obtained from socket.io. For more information
about socket io visit: http://socket.io/.

------------------
Websockets example
------------------

In the components folder you can find a simple example of how to send and receive messages.
Below you can find a function client controller example:

.. code-block:: javascript

    define(function() {

        function Controller() {}

        Controller.prototype.init = function () {
            this._socket = this.context.messaging.getSocket('chat');

            this.configureSocket();
            this.start();
        };

        Controller.prototype.start = function () {
            var root = this.context.getRoot(),
                btnTalk = root.find("input[data-itemid='btnCustomHandler']");

            var self = this;

            btnTalk.click(function () {
                self._socket.emit('new-message', {text: 'Welcome!'});
            });
        };

        /**
         * Method used to communicate with the chat server side handler.
         */
        Controller.prototype.configureSocket = function () {
            this._socket.on('hello', function (data) {
                alert(data.message);
            });
        };

        return Controller;
    });

The above example does the following:

   + Send a welcome message through the websocket.
   + Display de message data received for *hello* message.

RAIN websockets provide a module of idle time disconnect. If a client is innactive for a preset time
and the number of admitted websocket connections on the server is reached than the idle websockets
are disconnect. If the client tries to emit any type of event over it's websocket channel than
the connection is reestablished.

-----------------
Cookie Expiration
-----------------

When the communication with the server is happening only via Web Sockets, no headers are exchanged
and the cookie expiration time is never extended. To overcome this limitation, Web Socket
activity is monitored and when the cookie is about to expire, an AJAX call is sent to the server
if any message was sent or received. If no activity occurred, a ``session_expired`` event
is published globally to notify the application that the session for the current user expired.
One possible way to respond to this event is to redirect the user to the login page. The
following example shows how you can listen for this event::

    this.context.messaging.subscribe('session_expired', function() {
        alert('Expired Session');
    });

==========================
Client side websockets API
==========================

In RAIN you can easy access websockets that are defined in RAIN components. As described
in page :doc:`/server/websockets`, websockets in RAIN have a well defined model and are
auto discovered for each component. During autodiscovery process the web sockets handlers
receive a channel and they are registered at a certain url.

On the client side, to be able to connect to a websocket you need to specify the url. In
RAIN the client runtime provides easy access to websockets.

Below you can find a simple example of how to obtain a websocket connection for this case
(extracted from intents_example):

.. code-block:: javascript

   this._socket = this.context.messaging.getSocket("/component/version/channel");

After you obtain a connection to this websocket you can easily start to emit messages and
react to messages. The obtained socket is obtained from socket.io. For more information
about socket io visit: http://socket.io/

------------------
Websockets example
------------------

In the components folder you can find a simple example of how to send and receive messages.
Below you can find a function client controller example:

.. code-block:: javascript

    define(function() {

        function Controller() {}

        Controller.prototype.init = function () {
            this._socket = this.context.messaging.getSocket("/example/1.0/example");

            this.configureSocketDummy();
            this.start();
        };

        Controller.prototype.start = function () {
            var root = this.context.getRoot();
            var btnDummyTalk = root.find("input[data-itemid='btnCustomHandler']");

            var self = this;

            btnDummyTalk.click(function () {
                self._socket.emit("hello", {"ignored": true});
            });
        };

        /**
         * Method used to communicate with the dummy server side handler.
         */
        Controller.prototype.configureSocketDummy = function () {
            this._socket.on("bye", function (data) {
                alert(JSON.stringify(data));
            });
        };

        return Controller;
    });

The above example does the following:

   + Send a hello message through the websocket.
   + Display de message data received for *bye* message.

==========================
Client side websockets API
==========================

In RAIN you can easy access websockets that are defined in RAIN components. As described
in page :doc:`/server/websockets`, websockets in RAIN have a well defined model and are
auto discovered for each component. During autodiscovery process the web sockets handlers
receive a namespace and they are registered at a certain url.

On the client side, to be able to connect to a websocket you need to specify the url. In
RAIN the client runtime provides easy access to websockets.

------------------------------------
Websockets within the same component
------------------------------------

Client side controllers have direct access to websockets defined by their parent component.
Below you can find a simple example of how to obtain a websocket connection for this case
(extracted from intents_example):

.. code-block:: javascript

   this._socket = this.context.getWebSocket("chat/dummy socket");

After you obtain a connection to this websocket you can easily start to emit messages and
react to messages. The obtained socket is obtained from socket.io. For more information
about socket io visit: http://socket.io/

--------------------------------
Websockets from other components
--------------------------------

There will definitely be situations when you need to connect to a websocket that is not
defined within your component. To obtain a connection to such a websocket you can use
the following code:

.. code-block:: javascript

   this._socket = this.context.messaging._getWebSocket("<module-id>", "<socket name>");

Module id is formed from module-name minus version. Socket name includes the namespace into it.
For instance if we take the example described in :ref:`ws_same_comp` you would access dummy socket
with the following code::

   var messaging = this.context.messaging;

   this._socket = messaging._getWebSocket("intents-example-1.0", "chat/dummy socket");

------------------
Websockets example
------------------

In the components folder you can find a simple example of how to send and receive messages.
Below you can find a function client controller example:

.. code-block:: javascript

    define(function() {

        function Controller() {}

        Controller.prototype.init = function () {
            this._socket = this.context.getWebSocket("chat/dummy socket");

            this.configureSocketDummy();
            this.start();
        };

        Controller.prototype.start = function () {
            var messaging = this.context.messaging;

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

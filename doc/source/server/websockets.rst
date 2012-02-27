===============
RAIN Websockets
===============

RAIN aims to make new HTML5 specification accessible to user and also to provide graceful
degradation where necessary. Websockets are one of the coolest addition of HTML 5 and open
a new perspective in web development.

Do not understand this wrong: P2P connections are still not possible. Also it is worth
mentioning that work on websocket from HTML 5 is not finalize yet. In RAIN it is
really easy to use websockets.

-------------------------
RAIN Websockets Interface
-------------------------

In RAIN is really easy to use websockets. You don't even have to care about browser compatibility
because this is automatically provided by socket.io (the underlining framework used for websockets).

Each websocket you define must provide the methods from socket handler class::

   function SocketHandler() { }
      
   SocketHandler.prototype.getSocketName = function() {}
       
   SocketHandler.prototype.handle = function(socket) {}
   
In RAIN websockets are autodiscovered for each registered component. All you have to do
is to place your socket handlers under websockets folder of your component root.

Lets take a really simple example from intents_example component::

   /intents_example
      /controller
      /websockets
         /chat
            /dummy_socket_handler.js
      /htdocs
      
And now the dummy_socket_handler code::

   module.exports = DummySocketHandler;
   
   /**
    * This is just an example handler that is automatically registered.
    */
   function DummySocketHandler() {
       console.log("Dummy socket instantiated. ::::::::::::::::::::::::::::::::::::");
   }
       
   DummySocketHandler.prototype.getSocketName = function() {
       return "dummy socket";
   }
   
   DummySocketHandler.prototype.handle = function(socket) {
       socket.on("hello", function(data) {        
           socket.emit("bye", {"message": "Hello sir"})
       });
   }

At registration time, RAIN will map the socket handler automatically. This will become accesible
to: http://<rain_server>:<sockets_port>/intents-example-1.0/chat/dummy socket

As you can see subfolders are used to create a namespace for the websocket within the module
while value returned by getSocketName is used as the real name of the socket.

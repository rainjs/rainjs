





..
    Classes and methods

Namespace SocketHandlers
================================================================================

..
   class-title


Register handlers for core web socket events.








    


Constructor
-----------

.. js:class:: SocketHandlers









Methods
-------

..
   class-methods


changeLanguage
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: SocketHandlers.changeLanguage(socket)


    
    :param Socket socket: 
        the web socket object 
    




Listens to the change language event. After changing the language you should refresh the page
in order to see the components displayed with the new language.

The following example shows how the language can be changed on client-side::

     var socket = Sockets.getSocket('/core');

     // ensure that the socket was opened before calling emit
     socket.emit('change_language', 'de_DE', function (error) {
         window.location.href = window.location.href;
     });









    



register
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: SocketHandlers.register()





Registers handlers for the /core channel. This is not the complete list of registered handlers.
Complex events like ``render`` or ``request_intent`` have the handlers in their own files.









    




    




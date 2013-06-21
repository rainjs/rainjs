





..
    Classes and methods

Class SocketHandler
================================================================================

..
   class-title


Handler class for WebSockets that manages the way WebSocket instances are cached and
created.








    


Constructor
-----------

.. js:class:: SocketHandler()









Methods
-------

..
   class-methods


get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: SocketHandler.get()




    
    :returns SocketHandler:
         
    


Gets the singleton instance.









    



getSocket
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: SocketHandler#getSocket(channel)


    
    :param String channel: 
        the channel of the socket 
    



    
    :returns Socket:
        the websocket instance 
    


Gets the socket associated to a particular channel.









    




    




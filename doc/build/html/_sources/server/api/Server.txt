





..
    Classes and methods

Class Server
================================================================================

..
   class-title


Configures the server components and starts it.








    


Constructor
-----------

.. js:class:: Server()









Methods
-------

..
   class-methods


close
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Server#close([error])


    
    :param Error error: 
        the error that triggered the shutdown (if any) 
    




Softly shuts down the server closing any open pipes and connections.









    



logRotate
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Server#logRotate()





Renames the actual log file and restarts the logger;









    



start
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Server#start()





Starts the server.









    




    

Attributes
----------

..
   class-attributes


config
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: config   


the server configuration








    













..
    Classes and methods

Class Appender
================================================================================

..
   class-title


Abstract appender class.








    


Constructor
-----------

.. js:class:: Appender()









Methods
-------

..
   class-methods


append
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Appender#append(event)


    
    :param Event event: 
        The event to be appended to the log. 
    




Appends a message to the log.









    



destroy
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Appender#destroy()





Abstract method that needs to be implemented when an appender needs to clean up before it is
destroyed.









    



rotate
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Appender#rotate()





Abstract method that needs to be implemented when an appender needs to rename the file.









    




    




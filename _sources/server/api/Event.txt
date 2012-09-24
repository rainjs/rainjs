





..
    Classes and methods

Class Event
================================================================================

..
   class-title


Represents a logger event.








    


Constructor
-----------

.. js:class:: Event(level, message, error, logger, source)



    
    :param Number level: 
        The level of the event. 
    
    :param String message: 
        The log message. 
    
    :param RainError error: 
        The error associated with the log message. 
    
    :param String logger: 
        the logger name 
    
    :param String source: 
        the log statement location: 'server' or 'client' 
    







Methods
-------

..
   class-methods


date
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Event#date()




    
    :returns Date:
         
    


Gets the date at which the event was generated.









    



error
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Event#error()




    
    :returns RainError:
         
    


Gets the error associated with the log message.









    



level
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Event#level()




    
    :returns Number:
         
    


Gets the event level.









    



logger
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Event#logger()




    
    :returns String:
         
    


Gets the name of the logger.









    



message
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Event#message()




    
    :returns String:
         
    


Gets the event message.









    



source
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Event#source()




    
    :returns String:
         
    


Gets the event source.









    




    




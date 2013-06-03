





..
    Classes and methods

Class PatternLayout
================================================================================

..
   class-title


A layout that allows the administrator to configure the pattern for the logged messages::

     "logger": {
         "level": "info",
         "appenders": [{
             "type": "console",
             "layout": {
                 "type": "pattern",
                 "params": {
                     "pattern": "[%level] %date: %message"
                 }
             }
         }
     }








    


Constructor
-----------

.. js:class:: PatternLayout()




    
    :throws RainError:
        : if the params parameter is missing required keys
    






Methods
-------

..
   class-methods


format
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: PatternLayout#format(event)


    
    :param Object event: 
        the log event 
    
    :param String event.level: 
        the logging level 
    
    :param String event.date: 
        the message date 
    
    :param String event.name: 
        the logger name 
    
    :param RainError event.error: 
        the error 
    



    
    :returns :
         
    


Compose a log message based on the layout pattern and the current log event.









    




    




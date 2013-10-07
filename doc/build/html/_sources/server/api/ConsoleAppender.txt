





..
    Classes and methods

Class ConsoleAppender
================================================================================

..
   class-title


Colored console appender::

     {
         "type": "console",
         "layout": {
             "type": "pattern",
             "params": {
                 "pattern": "[%level] %date: %message"
             }
         },
         "params": {
             "debug": {
                 "foreground": "green"
             },
             "info": {
                 "foreground": "cyan"
             },
             "warn": {
                 "foreground": "yellow"
             },
             "error": {
                 "foreground": "red"
             },
             "fatal": {
                 "foreground": "black",
                 "background": "red"
             }
         }
     }








    


Constructor
-----------

.. js:class:: ConsoleAppender(level, layout, options)



    
    :param Number level: 
        the level 
    
    :param Layout layout: 
        the layout 
    
    :param Object options: 
        the colors configuration 
    







    

Attributes
----------

..
   class-attributes


BACKGROUND_COLORS
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: BACKGROUND_COLORS (static)  


Constants for background colors.








    



FOREGROUND_COLORS
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: FOREGROUND_COLORS (static)  


Constants for foreground colors.








    







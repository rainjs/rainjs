





..
    Classes and methods

Class SyslogAppender
================================================================================

..
   class-title


The syslog appender class is used for redirecting the log output to the syslog service:

     {
         "level": "debug",
         "type": "syslog",
         "layout": {
             "type": "pattern",
             "params": {
                 "pattern": "[%level] %date %logger: %message%newline%stacktrace"
             }
          },
          "params": {
              "identity": "",
              "facility": "LOCAL0"
          }
     }








    


Constructor
-----------

.. js:class:: SyslogAppender(level, layout, options)



    
    :param String level: 
        the log level for this instance 
    
    :param Layout layout: 
        the log layout to use 
    
    :param Object options: 
        the configuration options 
    
    :param String options.file: 
        the file to write to 
    
    :param String options.identity: 
        a string to be added to every log message (default is "") 
    
    :param String options.facility: 
        the syslog facility to log into (default is "LOCAL0") 
    







Methods
-------

..
   class-methods


destroy
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: SyslogAppender#destroy()





Destroy the appender.









    




    




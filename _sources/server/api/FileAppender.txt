





..
    Classes and methods

Class FileAppender
================================================================================

..
   class-title


The file appender class is used for redirecting the log output to a file::

     {
         "level": "debug",
         "type": "file",
         "layout": {
             "type": "pattern",
             "params": {
                 "pattern": "[%level] %date %logger: %message%newline%stacktrace"
             }
          },
          "params": {
              "file": "/path/to/file",
              "encoding": "utf-8",
              "mode": "0644"
          }
     }

Rotate is a method through which you can rename the logs for a period of time to a specified format
and restart logging fresh.

As a third party developer if you want to use the log rotate you need to use a simmilar configuration:

.. code-block:: javascript
   :linenos:

      "logger": {
        "level": "debug",
        "appenders": [{
             "type": "file", //type of the appender
             "layout": {
               "type": "pattern",
               "params": {
                     "pattern": "%logger - %source - [%level] %date: %message %stacktrace"
               }
             },
             "params": {
                 "file": "server.log", //where to append the logs
                 "rotateFile": {
                      "path": "server.log", //name of the renamed server.log
                      "format": "DD-MM-YYYY HH:mm", //add to the name this specific format
                      "days": -1 //log for the day before.
                 }
             }
         }]
     }

**rotateFile**: Optional key, if missing it will fall back to default, using the same name as the
original log file and adding a default format ``DD-MM-YYYY HH:mm`` with the days parameter equal to 0.

**path**: Optional key, specifying the path of the rotateFile, if missing it will set as default the
original log path.

**format**: Optional key, specifying the format of the rotateFile, the format will be appended to the
path, if missing the format will be set to ``DD-MM-YYYY HH:mm``.

The supported formats are:
- "YYYY-MM-DD"
- "YYYY-MM-DDTHH"
- "YYYY-MM-DD HH"
- "YYYY-MM-DDTHH:mm"
- "YYYY-MM-DD HH:mm"
- "YYYY-MM-DDTHH:mm:ss"
- "YYYY-MM-DD HH:mm:ss"
- "YYYY-MM-DDTHH:mm:ss.SSS"
- "YYYY-MM-DD HH:mm:ss.SSS"
- "YYYY-MM-DDTHH:mm:ss Z"
- "YYYY-MM-DD HH:mm:ss Z"

**days**: Optional key specifying how many days to be added to the current date, if missing
the default will be set to 0 (the current day).

As a third party developer if you want to trigger the log rotate you need to send a SIGUSR2
signal to the raind process.

      .. code-block:: guess

          kill -SIGUSR2 [pid of raind]

.. warning:: The path of the rotate log file should be on the same partition with the server log
   file.








    


Constructor
-----------

.. js:class:: FileAppender(level, layout, options)



    
    :param String level: 
        the log level for this instance 
    
    :param Layout layout: 
        the log layout to use 
    
    :param Object options: 
        the configuration options 
    
    :param String options.file: 
        the file to write to 
    
    :param String options.encoding: 
        the encoding to use for the log file (*Default*: 'utf-8')
    
    :param String options.mode: 
        the permissions to use when creating a new log file (*Default*: '0644')
    







Methods
-------

..
   class-methods


destroy
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: FileAppender#destroy()





Destroy the appender.









    



rotate
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: FileAppender#rotate()





Renames the actual log file and restarts the logger;









    




    




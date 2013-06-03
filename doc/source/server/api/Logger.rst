





..
    Classes and methods

Class Logger
================================================================================

..
   class-title


The logger for the RAIN platform. The logging system is comprised of *loggers*, *appenders*
and *layouts*. Each logger can use multiple appenders and an appender uses one layout.
Appenders specify where the log should be written (console, file, database) and layouts specify
how a message should be formatted. RAIN implements two appenders: ``console`` and ``file`` and
one layout: ``pattern``.

The platform logger configuration is placed in ``server.conf.default`` under the key ``logger``.
The following example configures the platform logger to use a console appender and a file
appender each of them using a pattern layout. The console appender inherits the level from
the platform level and the file appender specifies its own level, overriding the platform one::

     "logger": {
         "level": "info",
         "appenders": [{
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
         },
         {
             "level": "debug",
             "type": "file",
             "layout": {
                 "type": "pattern",
                 "params": {
                     "pattern": "[%source] [%level] %date %logger: %message%newline%stacktrace"
                 }
             },
             "params": {
                 "file": "/path/to/file"
             }
         }]
     }

Component specific appenders can also be configured in ``meta.json``. Developers can use custom
appenders and layout by setting ``type`` to be ``custom`` and ``file`` to point to the JavaScript
file that implements the custom appender or layout (this path is relative to the ``server`` folder
of each component. The platform lever can't be set in the component specific configuration::

     "logger": {
         "appenders": [{
             "type": "console",
             "level": "error",
             "layout": {
                 "type": "pattern",
                 "params": {
                     "pattern": "[%level] %date: %message"
                 }
             },
             "params": {
                 "debug": {
                     "foreground": "magenta"
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
         },
         {
             "type": "custom",
             "file": "path/to/file.js",
             "level": "info",
             "layout": {
                 "type": "custom",
                 "file": "path/to/file.js"
             }
         }]
     }

The logger can be used from both the server-side and client-side.

RAIN’s logging system defines 5 log levels: ``debug``, ``info``, ``warn``, ``error`` and ``fatal``.

In order to use the platform logger you need to obtain its reference by calling ``Logger.get``
and then you can write messages by calling one of its methods: ``debug``, ``info``, ``warn``,
``error`` or ``fatal``::

     var logger = require('./logging').get();
     logger.error('Error reading from file', error);
     logger.info('some message');


The logger also can rotate the log file:

Log Rotate is a method through which you can rename the logs for a period of time to a specified format
and restart logging fresh.

As a third party developer if you want to use the log rotation you  need to:

 - Have a configuration in the server conf for this rotation file;
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

  .. note:: The supported formats are:

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

  .. warning:: The path of the rotate log file should be on the same partition with the server log
     file.

 - Send a SIGUSR2 signal to the raind process to trigger the rotation.
      .. code-block:: guess

          kill -SIGUSR2 [pid of raind]








    


Constructor
-----------

.. js:class:: Logger(logger, appenders, [inheritedAppenders])



    
    :param String logger: 
        the logger name 
    
    :param Appender[] appenders: 
        The appenders used by the logger. 
    
    :param Appender[] inheritedAppenders: 
        The appenders inherited by a component logger from the platform logger. 
    







Methods
-------

..
   class-methods


debug
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Logger#debug(message, error)


    
    :param String message: 
        The message to be logged. 
    
    :param RainError error: 
        The associated error, if one exists. 
    




Logs a debug message.









    



destroyAll
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Logger.destroyAll()





Destroys all the loggers.









    



error
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Logger#error(message, error)


    
    :param String message: 
        The message to be logged. 
    
    :param RainError error: 
        The associated error, if one exists. 
    




Logs an error message.









    



fatal
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Logger#fatal(message, error)


    
    :param String message: 
        The message to be logged. 
    
    :param RainError error: 
        The associated error, if one exists. 
    




Logs a fatal error message. These are errors from which the server can't recover.









    



get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Logger.get([component])


    
    :param  component: 
        The component for which to create the logger. Creates the platform logger if component is undefined. 
    
    :param  component.id: 
        The component id. 
    
    :param  component.version: 
        The component version. 
    


    
    :throws RainError:
        : when the platform level is invalid.
    


    
    :returns Logger:
         
    


Initializes and returns the platform or component logger.









    



info
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Logger#info(message, error)


    
    :param String message: 
        The message to be logged. 
    
    :param RainError error: 
        The associated error, if one exists. 
    




Logs an info message.









    



rotate
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Logger.rotate()





Renames the actual log file and restarts the logger;









    



warn
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Logger#warn(message, error)


    
    :param String message: 
        The message to be logged. 
    
    :param RainError error: 
        The associated error, if one exists. 
    




Logs a warning message.









    




    

Attributes
----------

..
   class-attributes


LEVELS
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: LEVELS (static)(constant)  


Defines numeric values for the logger levels.








    







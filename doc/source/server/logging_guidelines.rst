==================
Logging guidelines
==================

This document describes the logging guidelines that should be followed by developers working on the
RAIN project and could also be extended to other developers writing RAIN components for their own
projects.

These guidelines take into consideration the features provided by the logger implemented in RAIN as
a core functionality.

Logging is a fundamental part of any application. A well designed and maintained logging system
will help system administrators, developers and support teams to avoid spending valuable hours
investigating problems.

--------------
Logging levels
--------------

There are five logging levels, going from "something went terribly wrong" with the application to
statements meant to help the developer investigate problems. What you must remember is to put the
log statements in the appropriate category, otherwise something important will not be noticed or
you will fill the production logs with unwanted information that makes them harder to read.

The levels have an decreasing severity: ``fatal > error > warn > info > debug``. If you set the
logging level to ``warn`` only ``warn``, ``error``, ``fatal`` messages will be appended to the
location.

.....
Fatal
.....

This is the worst case scenario. In RAIN it means you can't recover from the error and you have to
restart the server. These errors have to be fixed very fast because they might make the server
unusable.

This logging level should not be used in RAIN components or by third party developers.

When to use:

- Listen to the ``uncaughtException`` event and log the server state before restarting it.
- When the server configuration file has the wrong format or is missing vital information that
  causes the server not to start.

.....
Error
.....

This means that some unexpected behavior appeared in the application's workflow. The server
still works but the error can cause unexpected behavior to the application's functionality.

When to use:

- When a subcomponent cannot be found. This could mean the component wasn't deployed or the exact
  requested version was replaced by a newer version. Do not use it for the main component because
  the user could have mistyped the address.
- When a core backend service becomes unavailable, like an external service
  or a database connection.
- When some expected and required resources are missing.
- When public API functions receive unexpected or malformed input parameters.

....
Warn
....

This means something can cause strange application behavior but the application can recover from
this and deliver correct results. These messages have to be analyzed.

When to use:

- When you started the server in debug mode even if it's a production server.
- When you don't have translation messages in the platform language for a specific component.
- When configuration or input parameters are missing but you can determine default values for them.
- When user input parameters might indicate security problems, like introducing the wrong password
  multiple times.
- When some core services are responding slowly.

....
Info
....

This means the information is useful to the running and the management of the system. These
messages show that everything is working fine and gives information about the application's state.

When to use:

- When logging information about server startup / shutdown, configuration assumptions.
- When registering plugins or external dependencies to show that they loaded without problems.
- When the server's or component's state changed or to show the lifecycle of different rendering
  processes.

.....
Debug
.....

This is helpful information used by developers / IT department / system administrator to identify
problems. It's used primarily in the development stage. Be careful not to overdo it because you can
make the code harder to read.

When to use:

- When you want to log input parameters and return values for important functions.
- When you want to log the headers or data for HTTP requests and responses.

-----------
What to log
-----------

- Log exceptions, but not all of them. Some exceptions can be managed and they are thrown to
  simulate different functionality. Remember that it's useless a log full of errors that don't
  actually describe a problem.
- Log lifecycle events / states, they are very useful when trying to identify a problem.
- Log request headers and data (useful in debug mode).
- A log entry should answer the following questions:

  - **who?** - the application user name
  - **when?** - the current timestamp
  - **where?** - describe the context (core, component, database, external service), parameters and
    server information (this is required when having a distributed infrastructure)
  - **what?** - information about the current operation
  - **result?** - the error or a custom message containing useful information
- Do not log passwords, credit card information or other sensitive data.
- Avoid doing expensive computation just for logging.
- Make sure the log statements don't cause exceptions.

Each appender has an optional pattern property that can use different string patterns that are
automatically replaced by RAIN with the actual data. You can use this to automatically add
information about server, date and time, message priority, category.

The logs should be easy to read and from time to time analyzed in order to remove messages that
aren't needed anymore.

-----------------
Component logging
-----------------

The appenders are modules that save the messages in different storages (console, files, databases).
The RAIN logging system lets the developer customize their behavior: you can add new appenders, set
parameters or update their logging level to better fit your needs.

As a third party developer you cannot change the platform logging settings, only the settings for
your component. You can add an extra file appender that writes only the ``error`` level messages in
a specific layout pattern in a specific file. The logging level is optional for each appender and
inherited from the platform if it's not specified.

As a third party developer you may want to enhance the default logging settings if:

- You want to log the messages in a custom storage / format.
- You want to change the logging level / layout / parameters for a specific appender.
- You want to debug your component in production environment and change the level only for your
  component.

----------
Log Rotate
----------

Log Rotate is a method through which you can rename the logs for a period of time to a specified format
and restart logging fresh.

As a third party developer if you want to trigger this log rotation you  need to:

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
                        "format": "dd-mm-yyyy.hh:mm", //add to the name this specific format
                        "day": "-1" //log for the day before.
                    }
                }
            }]
        }

- Send a SIGUSR2 signal to the raind process.
    .. code-block:: guess

        kill -SIGUSR2 [pid of raind]

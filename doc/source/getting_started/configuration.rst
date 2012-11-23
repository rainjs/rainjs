==================================
Server and component configuration
==================================

A RAIN application has two major configuration points: the server configuration and the component
level configuration.

--------------------
Server configuration
--------------------

The RAIN server has a set of configuration options that are located in a configuration file. This
file has to be in a valid JSON object and when the RAIN server starts it is looked up in the
following order:

- if the ``dir`` parameter of the ``raind`` process is set, then the location is
  ``<dir>/conf/server.conf.default``
- the RAIN_CONF environment variable that has the full path to the configuration file
- the default configuration that is ``<project-root>/conf/server.conf.default``

If the configuration file is not found or the format is invalid then the server won't start.

..........
Parameters
..........

The server configuration file has required and optional parameters described below. The required
fields are formatted with **bold**. 

- **server** - an Object with the following keys:

  - **port** - the HTTP server port
  - **components** - an Array of folder paths that contain RAIN components. The folder path can
    be absolute or relative to the current working directory.
  - **timeoutForRequests** - the number of seconds the server should wait for a response when
    executing server-side code from a component's controller. If the timeout is reached the
    client receives an error response.

- **defaultLanguage** - a String representing the default language used by the I18N feature to
  translate messages and to determine what localized resources to use. This value is used to
  determine translated text when a message translation in a required language couldn't be found.

- language - a String representing the application language. This parameter is used by the I18N
  feature to translate messages and to determine what localized resources to use.

- logger - an Object used to configure the Logger feature. The logging level and appenders can also
  be configured here. For information about the entire structure of this parameter, check the
  :doc:`Logger API</server/api/Logger>`.

- languages - an Array of objects with ``key`` and ``text`` String keys used by the language
  selector component. Using this component the user can select the application language.

- errorComponent - an Object with ``id`` and ``version`` keys that sets what component to be used
  in exception cases. The default value is the ``error`` component provided in the RAIN SDK.

- loadingComponent - an Object with ``id``, ``version``, ``viewId`` and ``timeout`` keys that sets
  what component to be used while the client side waits for other components to be rendered. The
  default value is the ``placeholder`` component provided in the RAIN SDK. The ``timeout``
  parameter set how much to wait for a render response before showing the loading component.

- session - an Object used to configure the session store. It has a ``store`` key that represents
  the path to the store implementation. If the store implementation also needs configuration
  options then the ``session`` key will have to have the ``path`` (the implementation module path)
  and ``options`` (an Object with the store options) keys.

- identity - an Object used to set the :doc:`IdentityProvider </server/api/IdentityProvider>`
  implementation. It has a ``provider`` key that represents the path to the implementation module.

.......
Example
.......

.. code-block:: javascript
    :linenos:

    {
        "server": {
            "port": 1337,
            "timeoutForRequests" : 3,
            "components": ["./components"]
        },

        "defaultLanguage": "en_US",
        "language": "en_US",

        "logger": {
            "level": "debug",
            "appenders": [{
                "type": "console",
                "layout": {
                    "type": "pattern",
                    "params": {
                        "pattern": "%logger - %source - [%level] %date: %message %stacktrace"
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
            }]
        },

        "languages": [
            {"key": "en_US", "text": "English"},
            {"key": "de_DE", "text": "Deutsch"},
            {"key": "ro_RO", "text": "Română"},
            {"key": "ar_SA", "text": "عربي"}
        ],

        "errorComponent": {
            "id": "error",
            "version": "1.0"
        },

        "loadingComponent": {
            "id": "placeholder",
            "version": "1.0",
            "viewId": "index",
            "timeout": 500
        },

        "session": {
            "store": "./configuration/custom_session_store"
        },

        "identity": {
            "provider": "./configuration/custom_identity_provider"
        }
    }

-----------------------
Component configuration
-----------------------

Please read :doc:`Component configuration </server/component_descriptor>` for more information.

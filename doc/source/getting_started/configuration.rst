==================================
Server and component configuration
==================================

A RAIN application has two major configuration points: the server configuration and the component
level configuration.

.. warning::
    - You must have a conf folder or setup a conf folder for your project
    - Do not keep your credentials inside code, as a recommendation you can put them inside 
      a credentials.conf file the ``credentials`` name is not mandatory
    - All the configuration files must be named <name>.conf any other files will be ignored.

--------------------
Server configuration
--------------------

The RAIN server has a set of configuration files that are located in a configuration folder. These
files have to be in JSON format. When the RAIN server starts it reads all the files with the
``.conf`` extension from the configuration folder which is determined in the following order:

 - if the RAIN_CONF environment variable is set, this value is used
 - if the ``dir`` parameter of the ``raind`` process is set, the location is ``<dir>/conf``
 - the default configuration that is ``<project-root>/conf``

If no configuration files are found or the format is invalid then the server won't start.

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

- loginComponent - an Object with ``id``, ``version`` and ``viewId`` keys that specify where the
  client should be redirected after an unsuccessful authentication attempt.

- mainComponent - an Object with ``id``, ``version`` and ``viewId`` keys that specify where the
  client should be redirected after a successful authentication attempt if nothing else is
  specified after the login attempt as a redirect url.

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

         "loginComponent": {
            "id": "user",
            "version": "1.0",
            "viewId": "login"
        },

        "mainComponent": {
            "id": "sprint_example_list",
            "version": "1.0",
            "viewId": "index"
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

-----------------------------------
Sensitive information configuration
-----------------------------------

The sensitive information configuration file must be placed in the conf folder.

.......
Example
.......

.. code-block:: javascript
    :linenos:

    {

        "cookieSecret": "custom secret",
        "custom_sensitivekey": "custom sensitive value"

    }

The only required parameter is the *"cookieSecret"*

----------------------
Language configuration
----------------------

The rain server can support configuration for individual domains. It is advisable that you set
this configuration in another <filename>.conf in your conf folder. For example "language.conf".

A valid example of this configuration must look like this:

.. code-block:: javascript
    :linenos:

     {
        "tlds": {
            "net": {
                "defaultLanguage": "en_US",
                "supportedLanguages": ["en_US", "ro_RO", "en_UK"]
            },
            "com": {
                "defaultLanguage": "en_US",
                "supportedLanguages": ["en_US", "ro_RO", "en_UK"]
            }
        }
    }

As you can see in this example the first key is the domain than you have a defaultLanguage and
an array of supportedLanguages. Both of this parameters ``defaultLanguage`` and ``supportedLanguages``
are mandatory.

The userLanguage is set from the start depending on the browser accepted-language if it's accepted
or the defaultLanguage.

All the text for the selectLanguage menu must be set in the ``server.conf`` at the ``languages`` key.

..................
Expected behavior:
..................

- If there is a supported language on a domain that has no text for the select language component,
  it will not be included.
- If the browsers Accepted-Language header is not supported than the userLanguage will be set to
  the defaultLanguage
- If domain does not exist it will use the preset languages with default language in the server.conf

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
  - idleWebsocket - the number of seconds after which a socket becomes idle. The default value is
    1200 (20 minutes).

- **websocket** - an optional Object with the following keys:

  - idleTime - optional parameter in seconds regarding the default timeout time for an inactive
    websocket connection, default value is 1200 seconds (20 minutes).
  - disconnectIdle - optional boolean parameter telling the server if it should close the idle
    websocket connections or not, default value is false.
  - disconnectIdleOnMaxConn - optional parameter representing the maximal number of admitted
    websockets on the server, the default value is 2000. When this value is reached
    the websockets marked as idle will be closed.
  - idleCheckInterval - optional parameter in seconds representing the interval of time when
    the server should check if the number of connected websockets is greater than the
    configured ``disconectIdleOnMaxConn`` key and disconnect the websockets marked as idle.
    The default value is 10 seconds.

- **defaultLanguage** - a String representing the default language used by the I18N feature to
  translate messages and to determine what localized resources to use. This value is used to
  determine translated text when a message translation in a required language couldn't be found.

- language - a String representing the application language. This parameter is used by the I18N
  feature to translate messages and to determine what localized resources to use.

- enableClientLogging - a Boolean value that enables or disables the client-side logging.
  **For production environments this should be set to false**.

- enableMinification - a Boolean value that enables or disables the loading of
  minified javascript and css files.

- enableMinificationCSS - a Boolean value that enables loading of minified css files.

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

- cookieSecret - a String that is used to sign the cookies.

- cookieMaxAge - the number of seconds after which to expire the session cookie if no new
  requests are done by the user. The cookie is removed when the browser is closed if this value
  isn't specified.

- cookieSecure - enable or disable the cookie secure attribute. The default value is false.

- pageTitle - the default page title for all components. This can be overridden in the component's
  configuration file. If the previous two parameters are missing the title defaults to the
  component id.

- bootstrap - a list of parameters used to customize the head tags (script, link, meta) and a way
  to add scripts in the page footer.

  - customHead - boolean value (default = false) which allows the complete customization of the
    meta tags, stylesheets and scripts. This can be used if you want to specify different
    require-jquery or jquery versions.
  - headFile - the location of the file that contains the custom head contents
  - metas - an array of meta tag strings inserted before the link tags
  - links - an array of link tag strings inserted after the bootstrap.css link and before scripts
  - scripts - an array of script tags inserted after the link tags and before the script containing
    the require-jquery configuration
  - footerScripts - parameters used to insert scripts at the end of the body tag

    - external - an array of script tags inserted after all renderComponent scripts
    - inline - an array of file locations that are contain inline scripts. The contents of these
      files are read, join together and pre-compiled with Handlebars. The resulted compiled
      template is run with the following parameters:

      - component - the component configuration attributes. Using this attribute, you can pass
        component configuration options directly in the scripts.
      - path - the requested page path
      - user - the user attributes
      - isAuthenticated - boolean value that tells you if the user is logged in or not

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

        "websocket": {
                "idleTime": 5,
                "disconnectIdle": true,
                "disconnectIdleOnMaxConn": 2,
                "idleCheckInterval": 5
        },

        "defaultLanguage": "en_US",
        "language": "en_US",

        "enableClientLogging": false,

        "enableMinification": false,

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
        },

        "pageTitle": "RAIN component",

        "bootstrap": {
            "customHead": false,
            "headFile": "./resources/custom_bootstrap.html",
            "metas": [
                "<meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1'>"
            ],
            "links": [
                "<link rel='stylesheet' type='text/css' href='/globalComponent/resources/global.css'>"
            ],
            "scripts": [
                "<script type=\"text/javascript\" src=\"/globalComponent/js/util.js\"></script>"
            ],
            "footerScripts": {
                "external": [
                    "<script type=\"text/javascript\" src=\"/globalComponent/js/analytics.js\"></script>"
                ],
                "inline": [
                    "./resources/user_analytics.html"
                ]
            }
        }
    }

The inline scripts can look like this:

.. code-block:: javascript
    :linenos:

    <script type="text/javascript" src="/globalComponent/js/another_script.js"></script>
    <script type="text/javascript">//<![CDATA[
        var page = '{{component.id}}/{{path}}';
        {{#if isAuthenticated}}
            var username = '{{user.username}}';
        {{/if}}
    //]]></script>

-----------------------
Component configuration
-----------------------

Please read :doc:`Component configuration <../server/component_descriptor>` for more information.

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

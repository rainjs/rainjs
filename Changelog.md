# Changelog

## 0.34.1

* Two small fixes for the translations to work in the error pages.

## 0.34.0

* Fixed a bug of the rain css minification process. The css minification now supports having
 the css files grouped in folders.
* Improved the generate-nginx-conf SDK command so it can take additional parameters:
source config file, destination config file and production path can now be specified in
the build.json file.
* Implemented handleHttpMethods module to treat non existent method calls and ``TRACE`` method
calls.
* Zabbix module: sesion requests are no longer separated by tld and metrics are now sent to Zabbix even if no changes have been detected in the last interval of time.

## 0.33.0

* Added the possibility of serving static files that are component independent so that generic
web application files on generic paths can be offered (e.g. robots.txt).
* Added a new SDK command that generates a configuration file for NginX so that
static files can be served when using NginX.

## 0.32.1

* Added the ``cookieSecure`` option to the server configuration to enable or disable the cookie
secure attribute.

## 0.32.0

* RAIN now works with Node.js 0.8.x and 0.10.x except the node-syslog module.
* Fixed a fatal error in the code that tracks idle web sockets.
* Fixed a fatal error in socket registry: the handshake is removed when the socket is disconnected.

## 0.31.0

* Implemented CSS minification for RAIN projects.
* Fixed bug: external javascript modules weren't loaded correctly for minified projects.
* Fixed bug: RainError wasn't working properly on IE 10.
* Fixed bug: when using ``context._getChildren`` an error was thrown if multiple child components
  were not found.
* Fixed bug: in some situations the placeholder was registered instead of the actual component.
* Fixed bug: in some situations the child components where duplicated in the children array.
* Fixed bug: a load timeout was happening randomly when loading modules using RequireJS. This
  was fixed by disabling the load timeout in the RequireJS configuration.

## 0.30.0

* Added SDK command to minify project
* Added date, time, number, currency, percentage and date range handlebars helpers
* Added format module to format date, time, number, currency, percentage and date range.
* Implemented ttl for mongodb session store
* Implemented primary indexing for mongodb session store

## 0.29.0

* Added functionality to prevent the session cookie from expiring when only web sockets are used.
  This works by sending an AJAX request to the server when the cookie is about to expire.
  An event is published when the cookie expires.

## 0.28.1

* Use an empty Jed instance when a component instance is not found.

## 0.28.0

* Added the ability to add a custom id for translation messages. See the documentation for
  ``t`` and ``nt`` methods from client and server side JavaScript and ``t`` and ``nt`` helpers
  for more details.
* The output of ``t`` and ``nt`` handlebars helpers can be saved in a variable and used later
  in the template. The ``var`` attribute should be used to achieve this behavior.
* The user is automatically redirected to the login page when the main component requires an
  authenticated user and the current user is not authenticated.
* Added support for configurable bootstrap head tags. Meta, link and script tags can be added to
  the head element or you can specify custom content. The page title can also be customized.
* If the user is authenticated, he is redirected to the main page when trying to access the
  login page.
* Added ``no-store`` to the cache headers. This prevents the browser to take the page from
    cache when using the back button.

## 0.27.1

* Fixed an issue where the disconnect method of the socket object was called on a null reference.
* Fixed an issue where a message was sent multiple times when the socket reconnected.

## 0.27.0

* Idle websocket disconnect and reconnect.
* Implemented Memory Store.
* SysLog Log appender support.
* Fixed context.insert bug(the callback received the placeholder).
* Fixed synchronization bug on notes.


## 0.26.1

* Disabled runWithContext caching temporarily.

## 0.26.0

* Implemented monitoring module. This is a module used to measure various actions/events and send that data
  to an adapter. This adapter forwards data to the actual monitoring software.
* Implemented monitoring for: the number of fatal errors, websocket connections, idle websocket connections,
  render events received through websockets and view requests being processed.
* Imporved requireWithContext performance by using cache.


## 0.25.0

* Implemented log rotate. When a SIGUSR2 signal is sent to the process, RAIN renames the current
  log file and creates a new file that will be used by the file appender for subsequent log
  messages.
* When a CSS file is requested from the component in which it is placed the scope is no
  longer added at runtime.
* The ``init`` and ``start`` methods from the client-side controller are called first for the
  parent and then for the children.
* The DOM for a component is shown after the ``start`` event is triggered.

## 0.24.1

* Fixed a bug in identity provider where the same user was returned even if the session data
  changed.

## 0.24.0

* Reduced the number of session requests.
* Added ``useSession`` configuration option for the component's ``meta.json`` file. It indicates
* if the component needs session. The default value is ``false``. The global session is still
  retrieved for every request as it is needed for translation and identity provider.
* Added ``cookieMaxAge`` option to the server configuration (the value is in seconds). A browser
  session cookie will be used if this value is missing.
* Added ``idp`` (the identity provider instance for the current request), ``user`` (the
  current user) and ``environment`` on the custom request passed to the data layer method.
* Added ``idp``, ``user`` and ``environment`` on the HTTP request object for controllers.
* Added ``idp``, ``user`` and ``environment`` on the ``socket`` object for websockets.
* ``IdentityProvider.get(request.session)`` is no longer working since the global and component
  session are now separated. Use ``request.idp`` or ``request.user`` instead (applies to
  controller and data layer methods).
* Fixed a CSS renderer bug where wrong CSS was removed.

## 0.23.3

* Removed logger from po_utils because the rain terminal commands were not working anymore.

## 0.23.2

* Fixed a typo in controller_path module.

## 0.23.1

* Fixed ``rain create project`` command and added credentials.conf.
* Fixed internationalisation module - crashing on no ``tlds`` key with domains.

## 0.23.0

* Improved log messages.
* The server configuration can be split in multiple files and the server reads all the ``.conf``
  files from the specified directory. The environment variable ``RAIN_CONF`` accepts a folder,
  not the path to the configuration files. This allows storing sensitive information in a separate
  file.
* Added support for language configuration for multiple domains. The ``accept-language`` header
  is also considered when choosing a language.
* The ``view`` parameter of the component helper is now optional. The default value is ``index``.
* Fixed a CSS renderer bug where the same CSS file is added multiple times.
* A new method was added to ``controller.context`` called ``delete``. It deletes a component.
* Updated Handlebars to the 1.0.8.

## 0.22.0

* The partial templates feature was implemented: the ``partial`` Handlebars helper was added.
* The ``end`` callback that was passed to WebSocket handlers was removed. Now you can return a
  promise in order to delay the session save.
* The method ``context.messaging.getSocket`` changed to accept channel name as parameter. The
  old form ``/component-id/version/channel`` still works, but it isn't recommended.

## 0.20.0

* Fixed a "raind" bug: RAIN_CONF environment variable was ignored.
* Fixed an issue where calling raind from a sub-directory of the project would cause RAIN to crash.
* Fixed a bug where a socket would not be flagged as connected in client rendering and no
  components were rendered via websockets.

## 0.19.0

* Improved the CSS Renderer: now it can load more than 31 stylesheets and the loading process is
  more efficient. This change is transparent for the developers. Warning: IE8 and IE9 can't load
  more than 32000 CSS rules.
* Raintime was modified to generate static ids for the components with undefined static ids.
* The init and start methods of a client side controller can return a promise to delay the init
  and start events until the component is ready. Example: a component can wait for its children to
  load before emitting the start event.

## 0.18.0

* Client-side component dependencies can be requested using the ``js/path/file_without_extension``
  convention (example: ``js/file``, ``js/lib/file``). The previous way of requesting js files
  (``/component/optional_version/js/file.js``) still works but it's not recommended.
* Removed the ``util`` shortcut from the RequireJS paths. In order to use the ``util`` library you
  should request it using ``raintime/lib/util``.
* Fixed a bug where a component added to the page using ``context.insert`` could not be found.

## 0.17.0

* Added distributed rendering research.
* Added improved CSS rendering research.
* Improved the AsyncController methods and made all controllers inherit its methods.

## 0.16.0

* Fixed CSS files not loading in IE8.
* Added logger implementation for components and for client side.
* Added code coverage support as additional Jake commands.
* Added distributed websockets proposal.

## 0.15.0

* Added distributed session support by using mongodb as the session store.
* Added code coverage proposal.

## 0.14.0

* Added support for containers.
* Implemented identity provider for user authentication.
* Cached resources based on locale.

## 0.13.0

* Added support for dynamic internationalization.
* Added language selector component.
* Implemented the platform logger based on the feature proposal.
* Added new RAIN SDK command for generating .po files.

## 0.12.0

* Added session / request objects in the data layer.
* Added support for CSS media queries in the CSS Handlebars helper.
* Added RAIN logger feature proposal.
* Refactored the RAIN SDK and made it modular.

## 0.11.0

* Added an article about Node's best programming practices.

## 0.10.0

* Changed licensing model from MIT to BSD.

## 0.9.0

* Added support for client-side text localization.
* Added a service to transport localization files to the client.

## 0.8.0

* Implemented the security mechanism to intents.
* Added a configuration option for the platform language and default language.
* Added support for localized messages in the templates.
* Added support for localized messages in the server side code.
* Added support for localized images.
* Added support for extended context in templates.
* Added support for block components.
* Added the feature proposal for transporting localization files to the client.

## 0.7.0

* Rewrote all legacy server code: improvements in quality, structure and performance.
* New router middleware for connect supporting plugins.
* New component registry supporting plugins.
* Top-to-bottom async engine replaces old xml parser and renderer.
* HTTP transport layer that keeps the connection open and delivers components to the client as they are available.
* Websockets transport layer for subsequent view requests.
* Cache improvements: templates are precompiled at server startup.
* Client runtime API improved.
* Client rendering layer handling cached placeholder management and component insertion.

## 0.5.0

* Added login component for authentication against CloudIA notification service.
* Added button component.
* Added textbox component.
* Added dropdown list component for short to medium sized data.
* Added exception handler module.
* Added CloudIA session store implementation for connect.
* Added contract selector component that uses mocked contract data.
* Added static dashboard example.
* Added platform-level placeholder component and configuration.

## 0.4.0

* View urls use the same scheme as other resources (with /htdocs included).
* Client-side controller are fully supported.
* Components now have individual meta.json files, there is no global configuration file anymore.
* On startup, the component root folder is scanned for components which are then auto-registered.
* The server-side controller paths were fixed.
* Views support the rain.output request parameter, may be either 'html' or 'json'.
* Nested components are now fully supported, it is now possible to define child content for tags that is correctly
  resolved.
* Tags may now use different views of a component, see the default server configuration. Components can thus be used
  like tag libraries.
* The render code was rewritten, mostly from scratch.
* Many improvements in the supplied example components.

## < 0.4.0

Here be dragons.

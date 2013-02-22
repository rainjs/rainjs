=========
Changelog
=========

--------
v 0.23.3
--------

+ Removed logger from po_utils because the rain terminal commands were not working anymore.

--------
v 0.23.2
--------

+ Fixed a typo in controller_path module.

--------
v 0.23.1
--------

+ Fixed ``rain create project`` command and added credentials.conf
+ Fixed internationalisation module - crashing on no ``tlds`` key with domains.

------
v 0.23
------

+ Improved log messages.
+ The server configuration can be split in multiple files and the server reads all the ``.conf``
  files from the specified directory. The environment variable ``RAIN_CONF`` accepts a folder,
  not the path to the configuration files. This allows storing sensitive information in a separate
  file.
+ Added support for language configuration for multiple domains. The ``accept-language`` header
  is also considered when choosing a language.
+ The ``view`` parameter of the component helper is now optional. The default value is ``index``.
+ Fixed a CSS renderer bug where the same CSS file is added multiple times.
+ A new method was added to ``controller.context`` called ``delete``. It deletes a component.
+ Updated Handlebars to the 1.0.8.

------
v 0.22
------

+ The partial templates feature was implemented: the ``partial`` Handlebars helper was added.
+ The ``end`` callback that was passed to WebSocket handlers was removed. Now you can return a
  promise in order to delay the session save.
+ The method ``context.messaging.getSocket`` changed to accept channel name as parameter. The
  old form ``/component-id/version/channel`` still works, but it isn't recommended.

------
v 0.20
------

+ Fixed a "raind" bug: RAIN_CONF environment variable was ignored.
+ Fixed an issue where calling raind from a sub-directory of the project would cause RAIN to crash.
+ Fixed a bug where a socket would not be flagged as connected in client rendering and no
  components were rendered via websockets.

------
v 0.19
------

+ Improved the CSS Renderer: now it can load more than 31 stylesheets and the loading process is
  more efficient. This change is transparent for the developers. Warning: IE8 and IE9 can't load
  more than 32000 CSS rules.
+ Raintime was modified to generate static ids for the components with undefined static ids.
+ The init and start methods of a client side controller can return a promise to delay the init
  and start events until the component is ready. Example: a component can wait for its children to
  load before emitting the start event.

------
v 0.18
------

+ Client-side component dependencies can be requested using the ``js/path/file_without_extension``
  convention (example: ``js/file``, ``js/lib/file``). The previous way of requesting js files
  (``/component/optional_version/js/file.js``) still works but it's not recommended.
+ Removed the ``util`` shortcut from the RequireJS paths. In order to use the ``util`` library you
  should request it using ``raintime/lib/util``.
+ Fixed a bug where a component added to the page using ``context.insert`` could not be found.

------
v 0.17
------

+ Added distributed rendering research.
+ Added improved CSS rendering research.
+ Improved the AsyncController methods and made all controllers inherit its methods.

------
v 0.16
------

+ Fixed CSS files not loading in IE8.
+ Added logger implementation for components and for client side.
+ Added code coverage support as additional Jake commands.
+ Added distributed websockets proposal.

------
v 0.15
------

+ Added distributed session support by using mongodb as the session store.
+ Added code coverage proposal.

------
v 0.14
------

+ Added support for containers.
+ Implemented identity provider for user authentication.
+ Cached resources based on locale.

------
v 0.13
------

+ Added support for dynamic internationalization.
+ Added language selector component.
+ Implemented the platform logger based on the feature proposal.
+ Added new RAIN SDK command for generating .po files.

------
v 0.12
------

+ Added session / request objects in the data layer.
+ Added support for CSS media queries in the CSS Handlebars helper.
+ Added RAIN logger feature proposal.
+ Refactored the RAIN SDK and made it modular.

------
v 0.11
------

+ Added an article about Node's best programming practices.

------
v 0.10
------

+ Changed licensing model from MIT to BSD.

-----
v 0.9
-----

+ Added support for client-side text localization.
+ Added a service to transport localization files to the client.

-----
v 0.8
-----

+ Implemented the security mechanism to intents.
+ Added a configuration option for the platform language and default language.
+ Added support for localized messages in the templates.
+ Added support for localized messages in the server side code.
+ Added support for localized images.
+ Added support for extended context in templates.
+ Added support for block components.
+ Added the feature proposal for transporting localization files to the client.

-----
v 0.7
-----

+ Rewrote all legacy server code: improvements in quality, structure and performance.
+ New router middleware for connect supporting plugins.
+ New component registry supporting plugins.
+ Top-to-bottom async engine replaces old xml parser and renderer.
+ HTTP transport layer that keeps the connection open and delivers components to the client as they are available.
+ Websockets transport layer for subsequent view requests.
+ Cache improvements: templates are precompiled at server startup.
+ Client runtime API improved.
+ Client rendering layer handling cached placeholder management and component insertion.

-----
v 0.5
-----

+ Added exception handler module.
+ Added platform-level placeholder component and configuration.

-----
v 0.4
-----

Here be dragons.

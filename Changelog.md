# Changelog

## 0.20.0

* Fixed a "raind" bug and updated the project dependencies.

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

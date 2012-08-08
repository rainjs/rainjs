=========
Changelog
=========

------
v 0.14
------

+ Added support for containers
+ Implemented identity provider for user authentication
+ Cached resources based on locale

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

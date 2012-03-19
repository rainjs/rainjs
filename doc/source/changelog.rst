Changelog
=========

v 0.7
-----

+ Rewrote all legacy server code: improvements in quality, structure and performance
+ New router middleware for connect supporting plugins
+ New component registry supporting plugins
+ Top-to-bottom async engine replaces old xml parser and renderer
+ HTTP transport layer that keeps the connection open and delivers components to the client as they are available
+ Websockets transport layer for subsequent view requests
+ Cache improvements: templates are precompiled at server startup
+ Client runtime API improved
+ Client rendering layer handling cached placeholder management and component insertion

v 0.5
-----

+ Added login component for authentication against CloudIA notification service
+ Added button component
+ Added textbox component
+ Added dropdown list component for short to medium sized data
+ Added exception handler module
+ Added CloudIA session store implementation for connect
+ Added contract selector component that uses mocked contract data
+ Added static dashboard example
+ Added platform-level placeholder component and configuration
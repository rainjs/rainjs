========
RAIN IDE
========

RAIN is a platform based on JavaScript. It aggregates web components located on multiple servers,
it has significant implementation code both on server and client side, JavaScript and HTML files.
It uses the Handlebars template engine in HTML files.

JavaScript is a language that is very hard to inspect, so that's why programming IDE's have a hard
time developing features that work 100%, especially for NodeJS, that's a new technology. But these
features exists and based on them we can add additional features that will make developing RAIN
faster and easier.

These features can be implemented in the form of plugins for different existing IDEs. As far as
possible these should use the commands that are already provided by the RAIN SDK and visually
enhance their functionality. The plugins must work on Linux, Windows and MacOS.

-----------
Eclipse IDE
-----------

Eclipse is one of the most used open source IDE. It has a set of plugins for JavaScript Development
Tools (JSDT) that lets the developer create JavaScript projects and files, has a JavaScript editor
and many introspection tools. These tools are part of the Web Development Tools (WTP), the latest
version (3.4.1) being released on September 28th, 2012.

The best starting point for developing a RAIN plugin for Eclipse would be the JSDT. It should be
compatible with version 4.x of Eclipse.

The RAIN plugin will offer multiple features that can be developed progressively and in most cases
they are independent one from another.

..............
Create project
..............

This feature will give the developer a new wizard to create a RAIN project. It should extend the
existing JavaScript project wizard and add some specific RAIN configuration parameters like:

1. The location of the NPM folder or the RAIN SDK installation folder. This will be useful when the
   developer will want to run his project on a specific version of the RAIN SDK.
2. The endpoint for the location of the Mothership. This endpoint will be used to determine the
   project configuration file.
3. The endpoint to the component registry service. This endpoint will be used to determine what
   available components are there to be used in the current project. The information will be used
   in the RAIN HTML editor with the autocomplete functions to suggest components and to insert
   required parameters.

The wizard will use the ``create-project`` command from the RAIN SDK to generate the project folder
structure.

................
Create component
................

This feature will give the developer a new wizard to create a RAIN component in the existing RAIN
project. The wizard must have at least the component id and component version configuration
parameters. Optional parameters that can be later added: ``views``, ``permissions``.

The wizard will use the ``create-component`` command from the RAIN SDK to generate the component
folder structure.

................
RAIN perspective
................

This feature will give the developer an Eclipse perspective customized for RAIN that will be
associated automatically with RAIN projects and will contain:

1. The **project view navigator** customized to show the additional RAIN commands like:

    - New -> RAIN Project
    - New -> RAIN Component
    - New -> RAIN View
    - Run As -> RAIN Application
    - Debug As -> RAIN Application
    - RAIN -> Generate Translation Files
    - RAIN -> Deploy

2. The **RAIN server console** that displays the server state (started / stopped), the console
   output and additional commands to start / stop / restart the server.
3. The **RAIN HTML editor** that has autocomplete functionality for the available Handlebars
   helpers.
4. The **components view** that shows the available components and additional documentation about
   them.

...........
Run project
...........

This feature will give the developer the possibility to start and stop the RAIN server directly
from Eclipse. To achieve this, a new Eclipse command will be added that will use the ``raind``
command from the RAIN SDK to start the server.

This feature will add a new Eclipse View, the RAIN server console, that will capture the output
coming from the RAIN server. It will have additional commands to start / stop / restart the server.

...............
Components View
...............

This feature will give the developer the possibility to see what components are already available
to him to use. He will be able to configure the endpoint to a components' registry service that
will provide description and documentation about the available components.

The available components will be shown in an Eclipse View. When the developer clicks a component, a
Handlebars helper text will be inserted in the current RAIN HTML editor and will populate the
required parameters with default values.

................
RAIN HTML Editor
................

This feature will provide autocomplete support for the RAIN template files. An existing HTML editor
should be extended to detect Handlebars syntax and based on the list of available components and
autocomplete features to suggest available values for the component attributes.

The editor should be able to differentiate between different helpers and suggest the appropriate
parameters. E.g. for the CSS helper it should automatically add the ``path`` attribute.

...........................
Generate localization files
...........................

This feature will give the developer the possibility to run the ``generate-po-files`` command found
in the RAIN SDK directly from Eclipse using an Eclipse command. The developer should be able to
choose from multiple commands, depending if he wants to generate the translation files only for the
selected component, for all components or for specific languages.

.............
Debug project
.............

The debug process is essential to every development process and that's why debugging a RAIN project
in Eclipse will help the developer stay in the same environment that he uses to program. This
might not be that easy to implement because the JSDT don't offer any support for NodeJS, but a
research has to be done to see how a plugin can extend the existing Eclipse JavaScript debug
features.

.......................
Component documentation
.......................

This feature will integrate the Eclipse help system with the RAIN components articles and JSDoc
generated for its components. The result will be that the developer will see inside Eclipse
all he needs to know about each external component that he want to use: its APIs, usage examples.

=================
RAIN SDK Tutorial
=================

In this section you can find the tutorial for creating projects with RAIN SDK.
Please read :doc:`installation` before this.

--------------------
RAIN SDK Basic usage
--------------------

RAIN gives the developer two commands:

- ``rain`` - used to create projects, components
- ``raind`` - used to start the server

Below you can find a bunch of useful commands to use::

    rain --help
    raind --help

    Usage: rain <command> <options>
           raind <options>

-----------------------
RAIN SDK Create project
-----------------------

You can easily use RAIN SDK to create projects and components. To create a new project
execute the following commands:

#. Go to you workspace folder
#. rain create-project <project-name>
#. cd <project-name>
#. raind

Now you have your first RAIN project.
Try the following url in your browser: http://localhost:1337/hello_world/index.

-------------------
RAIN SDK Debug mode
-------------------

RAIN provides a debug mode for the server-side. You only have to start the server with --debug.
It automatically connects the Node native debugger with the port 5858.

If you want to use a graphical debugger then you can install the "node-inspector" NPM module.

For Linux::

    sudo npm install node-inspector -g

For Windows::

    npm install node-inspector -g

Now start the node-inspector in the command line with ``node-inspector`` and you can access
the debugger with http://localhost:8080.

------------------------------------------------
RAIN SDK Generate Localization files from source
------------------------------------------------

The **RAIN SDK** provides a method to generate localization files by parsing the sources for
the components, and generating ``.po`` for the specified locale through the ``rain generate-po-files``
command.

This command parses the translation ids used inside components and generates apropriate ``.po`` files
inside the components ``locale`` folders that can be later translated.

Usage::

    $ rain generate-po-files <output-locales> [component-id]

Example::

    # generate en_GB and de_DE po files for all components
    $ rain generate-po-files "en_GB,de_DE"

    # generate en_GB .po files for the example component, version 1.0
    $ rain generate-po-files "en_GB" "example;1.0" 

------------------------------------------------
RAIN SDK Minify Javascript files
------------------------------------------------

The rain SDK provides a method to generate a minified RAIN project.

All the js files from the client folder of components will be minified into an ``index.min.js`` file.

The new minified project is generated at the path specified in
the build.json file that can look like this:

.. code-block:: javascript

    {
        "additionalProjects": ["../rainjs"],
        "buildPath": "../min/sprint"
    }

If the ``buildPath`` key is missing then all the minified files will be generated in
the current project, in each component folder.

Example::

    #generate the minified project
    $ rain minify

A detailed description of this process can be found in
the :doc:`RAIN Minification Process </client/minification>` page.

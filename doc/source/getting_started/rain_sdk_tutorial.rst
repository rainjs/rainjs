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
RAIN SDK Minify
------------------------------------------------

The rain SDK provides a method to generate a minified RAIN project.

All the js and css files from the client folder of components will be minified into
an ``index.min.js``/``index.min.css`` file.

The new minified project is generated at the path specified in
the build.json file that can look like this:

.. code-block:: javascript

    {
        "additionalProjects": ["../rainjs"],
        "buildPath": "../min/sprint",
        "cssMinification": true,
        "javascriptMinification": true,
        "themes": {
                "diy": "diy",
                "cp": "cp"
         }
    }

If the ``buildPath`` key is missing then all the minified files will be generated in
the current project, in each component folder.

The ``themes`` key specifies the current css themes used in the project and their folder name.

Example::

    #generate the minified project (with the above configuration both javascript and css files will be minified)
    $ rain minify

A detailed description of this process can be found in
the :doc:`RAIN Minification Process </server/minification>` page.


------------------------------------------------
RAIN SDK Generate NginX Configuration File
------------------------------------------------

The rain SDK provides a method to generate a configuration file for NginX.

We are using NginX to serve static files/routes through NginX and reduce the load on the
RAIN server. We have chosen to reconfigure the HaProxy to redirect static routes requests
to NginX server and the rest of the requests to the RAIN server. The ``generate-nginx-conf``
command helps you to generate an NginX configuration file so it knows how to serve the requests
and mapping the components with different routes.

Examples::

  $ rain generate-nginx-conf

Optional parameters can be provided in the build.json file.
If no option is specified in the build.json, it will use ``bin/conf/nginx.conf`` from RAIN to generate
a ``nginx.conf`` file in the project root.

The optional parameters are ``sourcePath``, ``destinationPath``, ``productionPath``
and ``additionalProjectsProductionPaths``.

A detailed description of this command can be found in
the :doc:`NginX static routes server </server/nginx_static_routes>` page.

=================
RAIN SDK Tutorial
=================

In this section you can find the tutorial for creating projects with RAIN SDK.
Please read :doc:`/getting_started/installation` before this.

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

Examples:

    // Creates a new project in the current location.
    $ rain create-project my_project

    // Start the RAIN server for the current project.
    $ raind

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

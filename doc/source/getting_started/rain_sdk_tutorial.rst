=================
RAIN SDK Tutorial
=================

In this section you can find the tutorial for creating projects with RAIN SDK.
Please read :doc:`/getting_started/installation` before this.

--------------------
RAIN SDK Basic usage
--------------------

Below you can find a bunch of useful commands to use::

   rain --help

   Usage:

   $ rain

   Commands:

   $ create-project <path> <project-name>
   create a project

   $ create-component <component-name>
   create a component

   $ start [#pid]
   1. on project root the command starts the server and creates an pid file

   $ stop [#pid]
   1. on project root the command stops the associated server
   2. with [#pid] stops the server with the associated process id

   $ restart [#pid]
   1. on project root the command restarts the associated server
   2. with [#pid] restarts the server with the associated process id

   $ list [server] 
   lists all running server, with [type] only 1 of both will be displayed

   $ stopall
   shutting down all servers

   Options:

   -h, --help output usage information
   -d, --debug debugging
   -c, --conf <path_to_conf> start server with custom configuration
   -p, --platform <platform> choose the platform for the application available platforms: nodejs

   Examples:

   $ rain create-project /home/username/workspace newProject
   $ rain start
   $ rain start -c /home/username/workspace/custom_confs/server.conf
   $ rain stop
   $ rain stop 5361

   Rain creates the following structure on first start of a server:

   /home/user/.rain 
   A server pid file contains "PID /path/to/server-conf" and looks like this:
   "rain.server.5734" -> rain.server.PID

   Creating an Application

   2 modes will be available: quick mode and configuration mode (default)

   "Quick mode" creates the project with the nodejs skeleton and standard meta.json

   "Configuration mode" asks the user about different settings

   name
   author
   description
   version
   platform

-----------------------
RAIN SDK Create project
-----------------------

You can easily used rain sdk to create projects and components. To create a new project
execute the following commands:

   #. Go to you workspace folder
   #. rain create-project . <project-name>
   #. Just answer the question you are prompted and everything is ready.
   #. cd <project-name>
   #. rain start

Now you have your first RAIN project.
Try the following url in your browser: http://localhost:1337/<component-name>/index.

-------------------
RAIN SDK Debug mode
-------------------

Rain provides a debug mode for the server-side. You only have to start / restart the server
with --debug. It automatically connects the nodejs native debugger with the port 5858.

If you want to use a graphical debugger then you can install "node-inspector".
It's a node package manager module.

For Linux::
  sudo npm install node-inspector -g

For Windows::
  npm install node-inspector -g

Now start the node-inspector in the command line with ``node-inspector`` and you can access
the debugger with http://localhost:8080.

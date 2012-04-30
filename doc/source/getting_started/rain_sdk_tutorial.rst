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

   Usage: rain <options> <command>

  Commands:

    create-project <path> <project-name>
    create a project

    create-component <component-name>
    create a component

    start [#pid]
    start the server on project root

    stop [#pid]
    stop the associated server on project root
    stop the server with the associated with the process id [#pid]

    restart
    restarts the associated server on project root

    stopall
    shutting down all server

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -d, --debug                start the server with the node debugger
    			       server is NOT restarting on uncaught exceptions
    			       NOT working for windows

    -c, --conf <path_to_conf>  start server with custom configuration
    -n, --no-daemon            start server without daemon mode




  Examples:

    $ rain create-project /home/username/workspace newProject

    $ rain start
    $ rain start -c /home/username/workspace/custom_confs/server.conf

    $ rain stop
    $ rain stop 5361

   Rain creates the following structure on first start of a server:

   /home/user/.rain 

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
Try the following url in your browser: http://localhost:1337/<component-name>/<view-id>.

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

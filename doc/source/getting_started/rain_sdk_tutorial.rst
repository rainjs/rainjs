=================
RAIN SDK Tutorial
=================

In this section you can find the tutorial for creating projects with RAIN SDK. Previous this
step please read :doc:`/getting_started/installation`

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
   
   $ list [server|mothership] 
   lists all running server/motherships, with [type] only 1 of both will be displayed 
   
   $ stopall 
   shutting down all server and motherships
   Options:
   
   -h, --help output usage information 
   -d, --debug start the server with the node debugger 
   -c, --conf <path_to_conf> start server with custom configuration 
   -m, --mothership-conf <path_to_conf> start server with custom mothership configuration 
   -p, --platform <platform> choose the platform for the application Available platforms: nodejs 
   Examples:
   
   $ rain create-project /home/username/workspace newProject 
   $ rain start 
   $ rain start -c /home/username/workspace/custom_confs/server.conf 
   $ rain start -m /home/username/workspace/custom_confs/mothership.conf $ rain stop $ rain stop 5361 
   Rain creates following structure on first start of a server
   
   /home/user/.rain 
   A server pid file contains "PID /path/to/server-conf" and looks like this "rain.server.5734" -> rain.server.PID
   
   A mothership file contains the complete mothership configuration and looks like this "rain.ms.31337.11324" -> rain.ms.PORT.PID
   
   Creating an Application
   2 modes will be available: quick mode and configuration mode (default)
   
   "Quick mode" creates the project with the nodejs skeleton and standard meta.json
   
   "Configuration mode" asks the user about different settings
   
   name
   author
   description
   version
   platform
   
You need to be sure that redis server is started prior to starting the Rain SDK. It is strongly 
recommended to start redis server prior to use rain sdk.

RAIN SDK Create project
~~~~~~~~~~~~~~~~~~~~~~~

You can easily used rain sdk to create projects and components. To create a new project 
execute the following commands:

   #. Go to you workspace folder
   #. rain create-project . <project-name>
   #. Just answer the question you are prompted and everything is ready.
   #. cd <project-name>
   #. rain start
   
Now you have your first RAIN project. Try the following url in your browser: http://localhost:1337/components/<component-name>/htdocs/index.html.

RAIN SDK Debug mode
~~~~~~~~~~~~~~~~~~~

Rain provides a debug mode for the server-side. You only have to start / restart the server with --debug.
It automatically connect the nodejs native debugger with the port 8585. 

If you want to use a graphical debugger than you can install "node-inspector". It's a node package manager module.

For Linux::
   sudo npm install node-inspector -g
   
For Windows::
   npm install node-inspector
   export PATH=$PATH:/home/<your user folder>/node_kit/node_modules/node-inspector
   
Now start the node-inspector on the command line with node-inspector and you can access the debugger with http://localhost:8080

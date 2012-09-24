===============
Installing RAIN
===============

In this document you will find all the information needed to setup RAIN for development.

------------------------
Installing node.js & npm
------------------------

RAIN runs on the **node.js** platform. Installing this platform is the first step to developing with RAIN. **NPM** is also needed for package management.

............
Ubuntu Linux
............

.. code-block:: bash

   sudo apt-get install python-software-properties
   sudo apt-add-repository ppa:chris-lea/node.js
   sudo apt-get update
   sudo apt-get install nodejs npm

.......
Windows
.......

Download and run the official installer from http://nodejs.org/#download.

.......................................
Other Operating Systems / Distributions
.......................................

Follow the official node.js wiki at https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager and locate the steps for your operating system / distribution.

....................
Building from source
....................

Follow the official node.js wiki at https://github.com/joyent/node/wiki/Installation.

--------
RAIN SDK
--------

Installing the RAIN SDK is the easiest way to start developing a new project with RAIN. After
the installation is done, go ahead and read the :doc:`RAIN SDK Tutorial <rain_sdk_tutorial>` to start developing!

.....................
Linux / Unix / Mac OS
.....................

.. code-block:: bash

   sudo npm install -g node-gyp
   sudo npm install -g rain

.......
Windows
.......

Running NPM on Windows to install the RAIN package only works from a **MinGW bash** prompt. You can get a MinGW bash installation from two places:
    * The official git for Windows installer: http://www.git-scm.com/download/win
    * The GitHub for Windows installer: http://windows.github.com/ [#github]_

Inside a *bash* prompt, you then need to run::

   npm install -g rain

----------------
RAIN from source
----------------

This is the way to go if you want to contribute to this project. To get started with this
you need to execute the following commands:

.....................
Linux / Unix / Mac OS
.....................

.. code-block:: bash

   sudo apt-get install git
   git clone https://github.com/rainjs/rainjs.git
   cd rainjs
   sudo npm install -g node-gyp
   sudo npm link

.......
Windows
.......

You first need to install git. You have two equally excellent options:
    * The official git distribution for Windows: http://www.git-scm.com/download/win
    * GitHub for Windows: http://windows.github.com/

Inside a *bash* prompt, you then need to run::

   npm link

............
Running RAIN
............

Inside the project working directory, running the ``raind`` command will start the server.
Accessing http://localhost:1337/example/index will load the example component that comes with
the project's sources.

.. rubric:: Footnotes

.. [#github] Using GitHub for Windows requires a GitHub account

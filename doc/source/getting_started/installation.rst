=================
RAIN Installation
=================

In this document you will find all the information required for configuring RAIN
development machine.



Nodejs server
-------------

Linux / Unix / Mac OS
~~~~~~~~~~~~~~~~~~~~~

Before you start to install node make sure you have the following tools installed:
   #. unzip (Ubuntu: sudo apt-get install unzip)
   #. gcc (Ubuntu: sudo apt-get install gcc)   
   #. g++ (Ubuntu: sudo apt-get install g++)
   #. openssl (Ubuntu: sudo apt-get install openssl)
   #. libssl-dev (Ubuntu: sudo apt-get install libssl-dev)
   #. make (Ubuntu: sudo apt-get install make)

Now you can start installing node.

   #. wget https://github.com/joyent/node/zipball/v0.4.12 -O node-v0.4.12.zip   
   #. unzip node-v0.4.12.zip   
   #. cd joyent-node-41e5762   
   #. chmod u+x configure 
   #. chmod u+x tools/waf-light
   #. ./configure && make && sudo make install
   #. make sure /usr/local/bin is added to your PATH environment variable.
   #. node - to make sure node can be run
   #. curl http://npmjs.org/install.sh | sh
   
Windows OS
~~~~~~~~~~

   #. Install cygwin with the following options checked for install
      + Base
      + Database
      + Devel
      + Editors
      + Mingw
      + Net (make sure curl is checked in)
      + Shells
      + Python
      + Perl
   #. Run cygwin
   #. Edit /etc/resolv.conf file and add your nameservers like: nameserver <ip>
   #. Download node from https://github.com/joyent/node/zipball/v0.4.12 -O node-v0.4.12.zip
   #. Extract node in your home folder from cygwin.
   #. Enter node folder
   #. ./configure && make && make install
   #. node - to make sure node can be run
   #. In the root folder of your node workspace execute:
   #. git clone https://github.com/cspotcode/npm.git
   #. cd npm
   #. ./configure && make && make install --- This will take a while so you can go grab a cup of coffee.
   #. npm -v

Redis Server
------------

For both RAIN SDK or RAIN from source code you need redis server.

Ubuntu OS
~~~~~~~~~

On Ubuntu is really simple::

   sudo apt-get install redis-server
   
Mac OS
~~~~~~

On Mac OS operating systems you need to execute the following commands:

   #. wget http://redis.googlecode.com/files/redis-0.900_2.tar.gz
   #. tar xzvf redis-0.900_2.tar.gz
   #. cd redis-0.900
   #. make
   
I recommend you do not install this globally. It is better if you simply run the following
command from redis-0.900 folder:

   #. ./src/redis-server
   
Windows OS
~~~~~~~~~~

   #. Download redis file https://github.com/downloads/dmajkic/redis/redis-2.4.2-win32-win64-fix.zip
   #. Unzip the file.
   #. cd redis-2.4.2-win32-win64-fix/32bit/
   #. ./redis-server.exe

Please execute this command everytime before actually running mothership and rain.

RAIN SDK
--------

Linux / Unix / Mac OS
~~~~~~~~~~~~~~~~~~~~~

The easiest way to configure your development machine is to use RAIN SDK. The SDK was currently
tested on Ubuntu Linux and on Mac OS X. Below you can find the commands to get the sdk running on
Unix / Linux operating systems:

   #. curl http://npmjs.org/install.sh | sudo sh   
   #. Execute npm -version to make sure npm is correctly installed.   
   #. sudo npm install rain -g
   
If everything went well you should be able to run rain sdk from command line. For more information
about RAIN sdk creating first project read: :doc:`/getting_started/rain_sdk_tutorial`

Windows Comments
~~~~~~~~~~~~~~~~

For RAIN SDK to run on Windows please run the following commands:

   #. cd /home/<your user folder>
   #. mkdir node_kit
   #. cd node_kit
   #. npm install rain@0.4.0
   #. export PATH=$PATH:/home/<your user folder>/node_kit/node_modules/rain
   
Now everything is ready for you. You can execute rain on command line. To improve the 
experience for later use edit your .profile file and add as last line the following command::

   export PATH=$PATH:/home/<your user folder>/node_kit/node_modules/rain

Like this you don't have to execute export command each time you launch cygwin.
   
RAIN from source code
---------------------

This is the way to go if you want to contribute to this project. To get started with this
you need to execute the following commands:

Linux / Unix / Mac OS / Windows
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

   #. git clone https://github.com/rainjs/rainjs.git
   #. cd rain
   #. npm install -d
   #. Make sure redis server is running.
   #. node node_modules/rain-mothership/run.js
   #. node run.js
   
Test installation
~~~~~~~~~~~~~~~~~

This should give you a running instance of RAIN server and mothership. For testing your
installation try to access: http://localhost:1337/components/cockpit/htdocs/main.html

If you see the following image it means your RAIN server is configured correctly.

.. image:: /getting_started/images/cockpit.png
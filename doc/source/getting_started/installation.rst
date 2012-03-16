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

   #. wget http://nodejs.org/dist/v0.6.13/node-v0.6.13.tar.gz
   #. unzip node-v0.6.13.tar.gz
   #. cd node-v0.6.13   
   #. chmod u+x configure 
   #. chmod u+x tools/waf-light
   #. ./configure && make && sudo make install
   #. make sure /usr/local/bin is added to your PATH environment variable.
   #. node - to make sure node can be run
   #. curl http://npmjs.org/install.sh | sh
   
Installing via package manager:

   https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager
   
Windows OS
~~~~~~~~~~

   #. Download http://nodejs.org/dist/v0.6.13/node-v0.6.13.msi
   #. Install the msi package
   #. That's all :)
   #. NPM is in the bundle too ;)

Mac OS
~~~~~~

On Mac OS operating systems you need to execute the following commands:

   #. Download http://nodejs.org/dist/v0.6.13/node-v0.6.13.pkg
   #. Install the package
   #. That's all :)
   #. NPM is in the bundle too ;)
   
RAIN SDK
--------

Linux / Unix / Mac OS
~~~~~~~~~~~~~~~~~~~~~

The easiest way to configure your development machine is to use RAIN SDK. The SDK was currently
tested on Ubuntu Linux and on Mac OS X. Below you can find the commands to get the sdk running on
Unix / Linux operating systems ( npm is required! ):

   #. sudo npm install rain -g
   
If everything went well you should be able to run rain sdk from command line. For more information
about RAIN sdk creating first project read: :doc:`/getting_started/rain_sdk_tutorial`

RAIN from source code
---------------------

This is the way to go if you want to contribute to this project. To get started with this
you need to execute the following commands:

Linux / Unix / Mac OS / Windows
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

   #. git clone https://github.com/rainjs/rainjs.git
   #. cd rain
   #. npm install -d
   #. node start
   
Test installation
~~~~~~~~~~~~~~~~~

This should give you a running instance of RAIN server and mothership. For testing your
installation try to access: http://localhost:1337/example/index

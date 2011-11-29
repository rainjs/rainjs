=================
RAIN Installation
=================

In this document you will find all the information required for configuring RAIN
development machine.

Redis Server
------------

For both RAIN SDK or RAIN from source code you need redis server.

Ubuntu Setup
~~~~~~~~~~~~

On Ubuntu is really simple::

   sudo apt-get install redis-server
   
Mac OS
~~~~~~

On Mac OS operating systems you need to execute the following commands::

   wget http://redis.googlecode.com/files/redis-0.900_2.tar.gz
   tar xzvf redis-0.900_2.tar.gz
   cd redis-0.900
   make
   
I recommend you do not install this globally. It is better if you simply run the following
command from redis-0.900 folder::

   ./src/redis-server   

RAIN SDK
--------

The easiest way to configure your development machine is to use RAIN SDK. The SDK was currently
tested on Ubuntu Linux and on Mac OS X. Below you can find the commands to get the sdk running on
Unix / Linux operating systems:

   #. wget https://github.com/joyent/node/zipball/v0.4.12 -O node-v0.4.12.zip   
   #. jar -xf node-v0.4.12.zip   
   #. cd joyent-node-41e5762   
   #. chmod u+x configure 
   #. chmod u+x tools/waf-light
   #. ./configure && make && make install
   #. make sure /usr/local/bin is added to your PATH environment variable.
   #. node - to make sure node can be run   
   #. curl http://npmjs.org/install.sh | sudo sh   
   #. Execute npm -version to make sure npm is correctly installed.   
   #. sudo npm install rain -g
   
If everything went well you should be able to run rain sdk from command line. For more information
about RAIN sdk creating first project read: :doc:`/getting_started/rain_sdk_tutorial`
   
RAIN from source code
---------------------

This is the way to go if you want to contribute to this project. To get started with this
you need to execute the following commands::

   #. wget https://github.com/joyent/node/zipball/v0.4.12 -O node-v0.4.12.zip   
   #. jar -xf node-v0.4.12.zip   
   #. cd joyent-node-41e5762   
   #. chmod u+x configure 
   #. chmod u+x tools/waf-light
   #. ./configure && make && make install
   #. make sure /usr/local/bin is added to your PATH environment variable.
   #. node - to make sure node can be run   
   #. curl http://npmjs.org/install.sh | sudo sh
   #. git clone git@github.com:rainjs/rainjs.git rain
   #. cd rain
   #. npm install -d
   #. node node_modules/rain-mothership/run.js
   #. node run.js
   
This should give you a running instance of RAIN server and mothership. For testing your
installation try to access: http://localhost:1337/components/cockpit/htdocs/main.html

If you see the following image it means your RAIN server is configured correctly.

.. image:: /getting_started/images/cockpit_v1.0.png
=================
RAIN Installation
=================

In this document you will find all the information required for configuring RAIN
development machine.

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


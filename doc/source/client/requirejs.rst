===========================
Client runtime dependencies
===========================

On the client side in RAIN we use requirejs http://requirejs.org for loading scripts in a
non blocking way. This gives RAIN client side great speed and asynchronicity. Each javascript
code is grouped and exposed as a requirejs module. Below you can find a list of objects
that are provided to you all the time:

   + Raintime
   + ViewContext
   + Messaging
   + jquery

You will never have to require this modules as they are already accessible from you client
side controller.

Client side controller
----------------------

Client side controller is a special requirejs module that is automatically binded to a view.
You can find out how to do this by reading :doc:`/server/component_descriptor`. Currently,
client side controllers have two special methods that are automatically invoked::

   define(function() {
      function init() {
         // here you don't have access to dom tree so please don't do dom transformations.
         // you have full access to viewContext and clientRuntime objects:
         
         alert(this.viewContext);
         alert(this.clientRuntime);
      }
      
      function start() {
         // here you should place all dom transformations.
      }
      
      // it's mandatory to declare all public methods:
      return {init: init,
              start: start};
   });
   
Including other modules
-----------------------

To include other requirejs modules to you client side controller you can use the following::

   define(function() {
      function init() {
         require(["<path to dep1>", "<path to dep2>"], function(dep1, dep2)) {
            // do something when everything is loaded.
         }
      }
   });
   
Each component is automatically included in the bootstrap sequence which mean you have 
a shortcut to include javascript from it::

   define(["my-module/module_helper1"], function(moduleHelper1) {
      ....
   });
   
my-module is your module identifier as describe in component descriptor (see :doc:`/server/component_descriptor`).
This is really easy and gives you the advantage of not knowing the absolute path of the
module javascript files. This is automatically set up for you by RAIN.
   
Why do we even use requirejs?
-----------------------------

Requirejs automatically namespace javascript code. This mean that we do not pollute window
object and moreover we can easily aggregate modules without a single javascript clash. Moreover
your code is easily to maintain using this approach.
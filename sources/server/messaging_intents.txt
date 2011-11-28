=======
Intents
=======

In this document you can find usefull about intents and how they are implemented on server
side.

----------------
Defining intents
----------------

Each RAIN component can define intents. The only constraint is not to define the same intent
within the same component.

Currently a component can define the following intent types:

   + Intents that return views (this are mapped on component views)
   + Intents that execute a server side action and return their result (intent mapped on a nodejs module method).
   
In meta.json file each component can use the following format to define intents::

   "intents": [...
   {"action": "...",
    "category": "...",
    "type": "view" | "server",
    "provider: "...",
    optional_attributes
   ...]
   
Optional attributes are defined only for certain types of intents.
   
Intents mapped on views
-----------------------

This intent always return a json object that describes a view. Below you can find how 
intents mapped on views are defined::

    ...
    "views": [
        {"viewid": "missing_intent",
         "view": "/htdocs/missing_intent_example.html",
         "controller": "/htdocs/scripts/missing_intent_example.js"}
    ],
    "intents": [{
        "action": "com.rain.test.general.SHOW_CHAT",
        "category": "com.rain.test.general",
        "type": "view",
        "provider": "missing_intent" 
    },
    ....

For this kind of intents provider is matched against a component viewId. If the viewId
is not found than the registration process will throw an error.

Intents mapped on server side code
----------------------------------

This intent always return the object returned by the server side code. There are many
use cases for this type of intent. For instance, imagine you want to implement a shopping
cart that is not always displayed on screen. In RAIN you can easily use intents for this.
Below you can find a simple example of how to use this intent (extracted from components/intents_example)::

   intents: [....
   {"action": "com.rain.test.serverside.INLINE_LOGGING",
     "category": "com.rain.test.general",
     "type": "server",
     "provider": "/controller/intents/inline_logging.js",
     "method": "doLogging"}
    ...]

The client will receive a json representation of data returned by the server side controller.
Provider for this intent is relative to component root path. As you can see in the code
snippet above you also need to specify method attribute. Each method specified in there
must have the following signature::

   method(intentCtx, session)
   
Intent context parameter gives developer access to what was send from client side. Session
object is the current user http session object.

Below you can find a complete server side intent handler code::

   exports.doLogging = function(intentCtx, session) {
       var msg = "doLogging method: " + intentCtx.message || "No message specified";
       
       console.log(msg);
       
       return {"data": msg};
   }
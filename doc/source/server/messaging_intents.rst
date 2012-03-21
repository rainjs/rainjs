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
        "action": "SHOW_CHAT",
        "category": "com.rain.test.general",
        "type": "view",
        "view": "missing_intent"
    },
    ....

For this kind of intents view is matched against a component viewId. If the viewId
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
     "controller": "/controller/intents/inline_logging.js",
     "method": "doLogging"}
    ...]

The client will receive a json representation of data returned by the server side controller.
Controller for this intent is relative to component root path. As you can see in the code
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

Usually as a developer you will do more complicated things on a server side mapped intent
than just logging. Most of the time you will want to access the session you receive to read / write
values. The read value in this case is not async but the write on the other hand is. For write
operations you need to take special precautions so that no unexpected results occur (when you write
something you need to use promises). Below you can find an example of how to correctly read / write values
to session:

.. code-block:: guess
  :linenos:

   var modPromise = require("promised-io/promise");

   exports.executeSessionReadWrite = function(intentCtx, session) {
      var currentValues = session.get("my_key");
      var name = session.get("my_name");

      console.log(name);

      var defer = modPromise.defer();

      if(!currentValues) {
         currentValues = [];

         currentValues.push("test1");
         currentValues.push("test2);

         session.set("my_key", currentValues, function() {
            defer.resolve("msg": "Great job", "data": currentValues);
         });
      }

      return defer.promise;
   }

Internally, RAIN knows how to handle this kind of return (promise) and the behavior is predictable.

Intents mapped on views
-----------------------

This intent will return a json object that contains all information related to a view (css,
javascript, markup). The returned object can be easily displayed on the client using view manager
layer. Below you can find an example of how to define such an intent (example taken from intents_example
sample)::

   {
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
           "view": "missing_intent"
       }
       ...
       ]
   }

In this case view identifies a declared view within the component. The intents registry simply
publish the intent to a global intents registry. The only constraint here is not to have
two intents with the same category and intent.

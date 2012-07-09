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
    "provider": "..."
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
        "provider": "missing_intent"
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
     "provider": "inline_logging.js#doLogging"
    ...]

As you can see in the code snippet above the provider contains the controller name and the method to
be execute separated by a *hash*. The method must have the following signature::

    function myFunction(intentContext, acknowledge) {
        // code here
    }

The intent context will contain the data sent from the client that might be necessary for running the
bsiness logic.

The ``acknowledge`` method **must** be called in order to let the client  know that the intent has
finished. It accepts two parameters:
    * ``error`` - if an error has occured pass it here, otherwise set it to null
    * ``data`` - the result data (can be undefined)

Below you can find a complete server side intent handler implementation::

   exports.doLogging = function(intentContext) {
       var msg = "doLogging method: " + intentContext.message || "No message specified";

       console.log(msg);

       return {"data": msg};
   }

Internally, RAIN knows how to handle this kind of return (promise) and the behavior is predictable.

Intents mapped on views
-----------------------

This intent will display the provided view to the client abstracting away the logic of displaying it
yourself::

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
           "provider": "missing_intent"
       }
       ...
       ]
   }

In this case *provider* identifies a declared view within the component. The intents registry simply
publishes the intent to a global intents registry. The only constraint here is not to have
two intents with the same category and intent.

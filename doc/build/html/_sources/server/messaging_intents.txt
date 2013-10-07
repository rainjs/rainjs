=======
Intents
=======

In this document you can find useful about intents and how they are implemented on server side.

----------------
Defining intents
----------------

Each RAIN component can define intents. The only constraint is not to define the same intent within
the same component.

Currently a component can define the following intent types:

- Intents that return views (this are mapped on component views)
- Intents that execute a server side action and return their result (intents mapped on a NodeJS
  module method)

In the ``meta.json`` file each component can use the following format to define intents::

   "intents": [
        {
            "category": "...",
            "action": "...",
            "provider": "...",
            "permissions": "..."
        }
   ]

The ``category`` and ``action`` parameters are used to split into categories the multiple
functionality provided by different components. The format for them are left up to the developer
and to the specifics of applications.

-----------------------
Intents mapped on views
-----------------------

This gives the option to the client to render a page without knowing what component does the
implementation. Below you can find how intents mapped on views are defined::

    "views": {
        "missing_intent": {}
    },
    "intents": [
        {
            "category": "com.rain.test.general",
            "action": "SHOW_CHAT",
            "provider": "missing_intent"
        }
    ]

For this kind of intents, the ``provider`` parameter is the id of a view in the current component.
If the viewId is not found than the registration process will throw an error.

----------------------------------
Intents mapped on server side code
----------------------------------

This gives the the option to the client to execute an action without knowing what component does
the implementation. There are many use cases for this type of intent. For instance, imagine you
want to implement a shopping cart that it's not always displayed on screen. In RAIN you can easily
use intents for this. Below you can find a simple example of how to use this intent::

    "intents": [
        {
            "category": "com.rain.test.general",
            "action": "com.rain.test.serverside.INLINE_LOGGING",
            "provider": "inline_logging.js#doLogging",
            "permissions": ["log"]
        }
    ]

As you can see in the code snippet above the provider contains the controller name and the method
to be executed, separated by a *hash*. The method must have the following signature::

    function doLogging(data, context, acknowledge) {
        // code here
    }

The ``data`` parameter represents the information sent from the client-side needed to do the
intent's business logic, ``context`` gives access to the user session.

The ``acknowledge`` method **must** be called in order to let the client know that the intent has
finished. It accepts two parameters:

- ``error`` - if an error has occurred pass it here, otherwise set it to null
- ``data`` - the result data (can be undefined)

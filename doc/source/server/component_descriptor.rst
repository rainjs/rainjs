=========================
RAIN component descriptor
=========================

Each RAIN component is described using a JSON file. This file is called ``meta.json``. Before
going into details of what sections are currently available in RAIN we must define
what a RAIN component is:

   "A RAIN component is a set of views and constraints defined in the meta.json descriptor
   file. Each view can be individually accessed using a unique url. RAIN automatically applies
   defined constraints based on the request."

---------------------------
Complete descriptor example
---------------------------

The following descriptor example shows you a complete descriptor (with all sections currently
supported by RAIN):

.. code-block:: javascript

    {
        "id": "intents-example",
        "version": "1.0",
        "type": "component",
        "permissions": ["example"],
        "views": {
            "missing_intent" : {
                "view": "missing_intent_example.html",
                "controller": {
                    "client": "missing_intent_example.js",
                    "server": "index.js"
                }
            },
            "need_permissions" : {
                "view": "need_permissions.html",
                "controller": {
                    "client": "need_permissions.js"
                },
                "permissions": ["user", "admin"],
            }
        },
        "intents": [
            {
                "category": "com.rain.test.general",
                "action": "com.rain.test.general.SHOW_CHAT",
                "view": "missing_intent"
            },
            {
                "category": "com.rain.test.general",
                "action": "com.rain.test.serverside.INLINE_LOGGING",
                "provider": "inline_logging.js#doLogging",
                "permissions": ["log"]
            }
        ]
    }

-----------------
Module definition
-----------------

Here you define the module attributes:

- id - this is the module identifier
- version - this is the current module version
- type - ``component`` (default value) or ``container``. This field is optional.
- permissions - an array of required permission for the component.

----------------
Views definition
----------------

Here you define your module views. Each view you need accessible outside your component
or if you want to apply constraints on it must appear in this section:

- viewId - the keys in the ``views`` object; this is the unique identifier for this view
- view - the path to the view, relative to ``<component_folder>/client/templates/``
- controller - can have two keys: ``client`` and ``server``; the values represent the paths
  to the client and server-side controllers; the client-side controllers are located in
  ``<component_folder>/client/js`` and the server-side controllers are located in
  ``<component_folder>/server/controller``.
- useSession - indicates if the component needs session. The default value is ``false``.
- permissions - an array of permissions for the specific view.

------------------
Intents definition
------------------

The intents definition and implementation is on the server side, but they are called from the
client side. Please read :doc:`Intents configuration <messaging_intents>` for details about
configuration and :doc:`How to use intents on the client side </client/intents>` for usage.

----------------------
Permissions definition
----------------------

Please read :doc:`authorization` for more information.

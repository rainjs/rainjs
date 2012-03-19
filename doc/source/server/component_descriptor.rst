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
                "permissions": ["need_permissions"]
            }
        },
        "intents": [
            {
                "category": "com.rain.test.general.SHOW_CHAT",
                "action": "com.rain.test.general",
                "provider": "missing_intent",
                "type": "view"
            }
        ]
    }

-----------------
Module definition
-----------------

Here you define the module attributes:

   - id - this is the module identifier
   - version - this is the current module version

----------------
Views definition
----------------

Here you define your module views. Each view you need accessible outside your component
or if you want to apply constraints on it must appear in this section:

   - viewId - the keys in the ``views`` object; this is the unique identifier for this view
   - view - the path to the view, relative to ``<component_folder>/client/templates/``
   - controller - can have two keys: ``client`` and ``server``; the values represent the paths
                  to the client and server-side controllers; the client-side controllers are
                  located in ``<component_folder>/client/js`` and the server-side controllers
                  are located in ``<component_folder>/server/controller``

------------------
Intents definition
------------------

Please read :doc:`/server/messaging_intents` for more information.

----------------------
Permissions definition
----------------------

Please read :doc:`/server/authorization` for more information.

=========================
RAIN component descriptor
=========================

Each RAIN component is described using a JSON file. This file is called meta.json. Before
going into details of what sections are currently available in RAIN we must define
what a RAIN component is:
   
   "A RAIN component is a set of views and constraints defined in the meta.json descriptor
   file. Each view can be individually accessed using a unique url. RAIN automatically apply
   defined constraints based on the request."
   
Complete descriptor example
---------------------------

The following descriptor example shows you a complete descriptor (with all sections currently
supported by RAIN)::

   {
    "id"        : "intents-example",
    "version"   : "1.0",
    "url"       : "/components/intents_example",
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
    {"action": "com.rain.test.serverside.INLINE_LOGGING",
     "category": "com.rain.test.general",
     "type": "server",
     "provider": "/controller/intents/inline_logging.js",
     "method": "doLogging"}],
    "taglib": [
      {
         "namespace" : ""
         , "selector" : "toolbar"
         , "module" : "toolbar;1.0"
         , "view" : "/htdocs/toolbar.html"
      }]
   }

Module definition
-----------------

Here you define the module attributes:

   + id - this is the module identifier
   + version - this is the current module version
   + url - the base url of the components. All views are relative to this path.
   
Module views definition
-----------------------

Here you define your module views. Each view you need accesible outside your component
or if you want to apply constraints on it must appear in this section:

   + viewid - This is a unique identifier for this view
   + view - the view path relative to module url
   + controller - this is the client side controller path relative to module url.
   
Module intents definition
-------------------------

Please read :doc:`/server/messaging_intents` for more information.

Module cross referencing views
------------------------------

In this section tags are mapped on foreign views that are going to be used in this module.
Each tag definition must contain the following attributes:

   + namespace - A namespace for the tag. Currently this is not used.
   + selector - This is the selector that is going to be used in markup: Ex <toolbar />
   + module - This is the module identifier from which we extract the tag: [<module-id>-<version>]
   + view - The relative path of the view. This will gonna be changed to viewid.
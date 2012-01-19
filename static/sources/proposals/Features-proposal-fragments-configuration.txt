====================================
Fragments Configuration Introduction
====================================

In this section you can find information about how to configure fragments. From RAIN perspective, a module can contain multiple fragments. This proposal is orientated on fragment level configuration. The following questions are answered into this section:

   - What can I configure for a fragment?
   - Can I dynamically update a fragment configuration?
   - How can I access fragment configuration?

----------------------
Rain module definition
----------------------

Currently in RAIN each module is defined as follow (configuration is stored in meta.json file):

.. code-block:: javascript
    :linenos:

    {
      "id" : "example-app;1.0",
      "url" : "/modules/example-app",
      "settings" : {
        "default_language" : "ro_RO"
        "recordsPerPage" : 20
      },
      "views" : [
        {"viewId" : "display-cities",
         "view" : "/htdocs/display_cities.html",
         "controller" : "/htdocs/scripts/display_cities.js",
         "settings" : {
           "location" : "Romania"
         }
        }
      ]
    }

--------
Sections
--------

--------------
Module section
--------------

This is the general section where you can define module identifier and the base url.

--------
Settings
--------

These are general settings of the module. Each view will inherit these settings.

^^^^^
Views
^^^^^

This is the section where you define all public views of the module

^^^^^^^^^^^^^^^
View controller
^^^^^^^^^^^^^^^

This is the javascript file that will be executed automatically on client browser when the fragment is loaded.

^^^^^^^^^^^^^
View settings
^^^^^^^^^^^^^

Each view can contain a list of settings that will be loaded by RAIN and automatically injected in client side controller.

^^^^^^^^^^^^^
View security
^^^^^^^^^^^^^

^^^^^^^^^^
View modes
^^^^^^^^^^
.. Rain documentation master file, created by
   sphinx-quickstart on Tue Nov 22 11:50:19 2011.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Rain |release| Documentation
========================

Welcome! This is the documentation for Rain |release|

---------------
Getting started
---------------

.. toctree::
    :maxdepth: 2

    getting_started/installation
    getting_started/rain_sdk_tutorial
    server/component_descriptor
    getting_started/coding_guidelines
    getting_started/documenting

-------------------
Client side modules
-------------------

.. toctree::
    :maxdepth: 2

    client/client_messaging
    client/intents
    client/requirejs
    client/websockets
    client/client_rendering
    client/rendering

....
APIs
....

.. toctree::
    :maxdepth: 1
    :glob:

    client/api/*

-------------------
Server side modules
-------------------

.. toctree::
    :maxdepth: 2

    server/messaging_intents
    server/websockets
    server/component_descriptor
    server/component_versioning
    server/handlebars/component_helper
    server/handlebars/css_helper
    server/handlebars/how_to_write_a_helper
    server/authorization
    server/data_layer
    server/platform_language
    server/localization

....
APIs
....

.. toctree::
    :maxdepth: 1
    :glob:

    server/api/*

----------
Components
----------

.. toctree::
    :maxdepth: 2

    server/error_component
    server/placeholder

-----------------
Features Proposal
-----------------

.. toctree::
    :maxdepth: 1
    :glob:

    proposals/*

---------
Changelog
---------

.. toctree::
    :maxdepth: 1
    :glob:

    changelog

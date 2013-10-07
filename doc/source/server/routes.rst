===========
RAIN Routes
===========

The types of routes supported by RAIN are: controller, css, view, javascript, locale and resource.

--------------------------
Handle Http Methods Module
--------------------------

When a request arrives the ``handleHttpMethods`` module checks the request method.
If the request is not one of the ones supported by 1&1, a response with a 501 status
code is sent back.

The methods supported by 1&1 are ``GET``, ``HEAD``, ``POST``, ``TRACE``, ``PUT``,
``PATCH``, ``DELETE`` and ``OPTIONS``;

If the request method is a ``TRACE`` then a response with a 200 status code and the same body as
the one received is sent back.

For the other supported methods, the request is handled according to its URL.

-----------------
Controller Routes
-----------------

Are related to the component controllers found in ``server/controller``.

Examples::

    1. <domain>/<componentName>/[<version>/]controller/<controllerName>
    2. http://localhost:1337/example/3.0/controller/text_localization

----------
CSS Routes
----------

These routes are related to the CSS files found in the client folder of the component.

Examples::

    1. <domain>/<componentName>[/<version>]/css/<path>
    2. http://localhost:1337/example/css/index.css

-----------------
Javascript Routes
-----------------

These routes are related to the static js files found in the client folder of the component.

Examples::

    1. <domain>/<componentName>[/<version>]/js/<path>
    2. http://localhost:1337/example/3.0/js/index.js

-------------
Locale Routes
-------------

The locales are translation files found in the locale folder of the component.

Examples::

    1. <domain>/<componentName>[/<version>]/locale/<localeName>
    2. http://localhost:1337/example/3.0/locale/en_US

---------------
Resource Routes
---------------

The resources are static files like images, pdf or text.

Examples::

    1. <domain>/<componentName>[/<version>]/resources/<path>
    2. http://localhost:1337/example/3.0/resources/images/ui-icons256x240.png

-----------
View Routes
-----------

Views are html files of located in the ``client/templates`` folder of the component.

Example::

    1. <domain>/<componentName>[/<version>]/<viewName>
    2. http://localhost:1337/example/3.0/index


.. note::

    For all the above routes if the 1&1 supported request method is not implemented by the
    endpoint then a response with a 405 status code and an ``Allow`` header with supported
    methods is sent.

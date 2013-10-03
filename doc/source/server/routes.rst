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

Examples::

    1. http://localhost:1337/componentName/versionNumber/controller/controllerName
    2. http://localhost:1337/componentName/controller/controllerName

----------
CSS Routes
----------

Examples::

    1. http://localhost:1337/componentName/versionNumber/css/fileName
    2. http://localhost:1337/componentName/css/fileName

-----------------
Javascript Routes
-----------------

Example::

    1. http://localhost:1337/componentName/versionNumber/js/fileName
    2. http://localhost:1337/componentName/js/fileName

-------------
Locale Routes
-------------

Example::

    1. http://localhost:1337/componentName/versionNumber/locale/localeName
    2. http://localhost:1337/componentName/locale/localeName

---------------
Resource Routes
---------------

Example::

    1. http://localhost:1337/componentName/versionNumber/resources/folderName/resourceName
    2. http://localhost:1337/componentName/resources/resourceName

-----------
View Routes
-----------

Example::

    1. http://localhost:1337/componentName/versionNumber/viewName
    2. http://localhost:1337/componentName/viewName


.. note::

    For all the above routes if the request method is not supported then a response with a 405 status code and an
    ``Allow`` header with supported methods is sent.










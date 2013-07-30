=========================
RAIN Minification Process
=========================

-------------
General Rules
-------------

During this process a new minified RAIN project is generated.

In the :doc:`server.conf </getting_started/configuration>` file minification should be enabled:

.. code-block:: javascript

    "enableMinification": true,


The path where this project is built should be specified in the ``build.json`` file as below:

.. code-block:: javascript
    :linenos:

    {
        "buildPath": "../min/sprint",
        "additionalProjects": ["../rainjs"],
        "javascriptMinification": true,
        "cssMinification": false
    }

The minification process can include both js and javascript or only one of them by modifying the
``javascriptMinification`` and ``cssMinification`` keys from above.

-----------------------
Javascript Minification
-----------------------

The tool used for JavaScript minification is RequireJS Optimizer.
All the js files from the client folder of each component will be minified into
an ``index.min.js`` file.
This file will be placed into the `client/js` folder of each component in
the newly generated project.

1. Dependencies can be included in the following way:

.. code-block:: javascript

        define([
                'js/lib/slick/jquery-ui-1.10.0.custom',  //internal
                'form/2.0/js/tooltip',                   //external
                'raintime/messaging/sockets'             //raintime
        ], function( JQuery, Tooltip, SocketHandler) {
            //code
        }

2. In the ``build.json`` file the javascriptMinification key should be set on ``true``:

.. code-block:: javascript
    :linenos:

    {
            "buildPath": "../min/sprint",
            "additionalProjects": ["../rainjs"],
            "javascriptMinification": true,
            "cssMinification": true
    }

If the ``buildPath`` key is missing then all the minified files will be added in the current project,
in the `client/js` folder of each component.

As you can see above, the ``build.json`` file can also include
an additional projects paths key needed by RequireJS.


-----------------
CSS Minification
-----------------

The tool used for CSS minification is less. It supports CSS minification using the YUI compressor.
All the css files from the client folder of each component will be minified into
an ``index.min.css`` file.

This file will be placed into the `client/css` folder of each component in
the newly generated project.

If the number of rules in the file exceeds 4095 then
additional min files (index1.min.css, index2.min.css etc) are created.


1. In the ``build.json`` file the ``cssMinification`` key should be set on ``true``:

.. code-block:: javascript
    :linenos:

    {
        "buildPath": "../min/sprint",
        "additionalProjects": ["../rainjs"],
        "javascriptMinification": true,
        "cssMinification": true,
        "themes": {
                "diy": "diy",
                "cp": "cp"
        }
    }

2. If the project is using css themes the build.json file should contain
an object with theme names as keys and their folder names as values, as it can be seen above.

.. note::

    A normal css file (Not minified) will be delivered in case of a css cross referencing request.


---------------------------
Running the minify command:
---------------------------

Example::

    $ rain minify









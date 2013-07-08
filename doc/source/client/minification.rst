-------------------------
RAIN Minification Process
-------------------------

During this process a new minified RAIN project is generated.

-----------------------
Javascript Minification
-----------------------
The tool used for JavaScript minification is RequireJS Optimizer.
All the js files from the client folder of each component will be minified into an ``index.min.js`` file.
This file will be placed into the `client/js` folder of each component in the newly generated project.

1. Dependencies can be included in the following way:

.. code-block:: javascript

        define([
                'js/lib/slick/jquery-ui-1.10.0.custom',  //internal
                'form/2.0/js/tooltip',                   //external
                'raintime/messaging/sockets'             //raintime
        ], function( JQuery, Tooltip, SocketHandler) {
            //code
        }


2. In the :doc:`server.conf </getting_started/configuration>` file minification should be enabled:

.. code-block:: javascript

    "enableMinification": true,


3. The path where this project is built should be specified in the ``build.json`` file as below:

.. code-block:: javascript

    {
        "buildPath": "../min/sprint",
        "additionalProjects": ["../rainjs"]
    }

If the ``buildPath`` key is missing then all the minified files will be added in the current project,
in the ``client/js`` folder of each component.

As you can see above, the ``build.json`` file can also include an additional projects paths key needed by RequireJS.

4. Running the minify command:

Example::

    $ rain minify









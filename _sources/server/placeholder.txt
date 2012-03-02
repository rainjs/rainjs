===========
Placeholder
===========

The new rendering engine that is currently in development will have the task of rendering parts of
the page as soon as it receives them. During the gathering process, instead of unavailable parts,
will display *placeholder* components that will tell the user, visually, that some parts are not
yet obtained from the server.

When the parts are retrieved, the placeholders are replaced with the actual html rendered text.

.. note::

    This placeholder component is configured at platform level and will be auto-discovered and
    automatically used by the rendering engine.

-------------
Configuration
-------------

The configuration for the placeholder is specified in the *server.conf* file. If it's missing, a
default *placeholder* component will be set: ::

    "loadingComponent": {
        "namespace": "",
        "selector": "placeholder",
        "module": "placeholder;1.0",
        "view": "/htdocs/index.html"
    }

You can define your own component to be used instead of the default one by adding a custom
*loadingComponent* key in the server configuration file.

.. warning::

    If the default / custom loading component is not found, the rendering process will not
    function as expected.

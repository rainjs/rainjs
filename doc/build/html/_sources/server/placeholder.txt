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

The configuration for the placeholder is specified in the ``server.conf`` file. If it's missing, a
default ``placeholder`` component will be set:

.. code-block:: javascript

    "loadingComponent": {
        "id": "placeholder",
        "version": "1.0",
        "viewId": "index",
        "timeout": 500
    }

The ``timeout`` property is used to tell how many milliseconds the rendering process will wait for
the component's data before displaying the placeholder.

You can define your own component to be used instead of the default one by adding a custom
``loadingComponent`` key in the server configuration file.

.. warning::

    If the default / custom loading component is not found, the rendering process will not
    function as expected.

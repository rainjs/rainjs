===============
Error component
===============

Error component is used to define error views for various HTTP error cases.
In this way, the developer will have full control over what will be displayed for a specific
HTTP error code. In order to achieve this, this component will contain a view for each HTTP
error code for which a custom message should be shown. If such a view doesn't exist a default
view will be shown.

-----
Usage
-----

By default this component is auto-discovered by the platform, but you can change the default
settings in the ``server.conf`` file.

.............
Configuration
.............

As a convention, this component is named ``error`` and the platform will always use
the latest version. However, you can override this behavior in the ``server.conf`` file by using
the following configuration options (version is optional and if it isn't specified, the latest
version will be used):

.. code-block:: javascript

    "errorComponent" : {
        "name": "error",
        "version": "2.3"
    }

............
View Example
............

The following example shows how the view for the 500 error code can look like:

.. code-block:: html

    <!DOCTYPE html>
    <html>
        <head>
            <title>Application Error</title>

            {{css path="index.css"}}
        </head>
        <body>
            <div class="content">
                <h1>500 Internal Server Error</h1>
                <p>
                    An unexpected condition was encountered. Please try the request again.
                </p>
            </div>
        </body>
    </html>

.........
meta.json
.........

This is the `meta.json` for this component. To specify a custom message for a error you add a view
for which the `viewid` is the same as the error code. If a view for an error doesn't exist, the
`default` view will be displayed:

.. code-block:: javascript

    {
        "id": "error_pages",
        "version": "1.0",
        "url": "/components/error_pages",
        "views": [
            {
                "viewid": "default",
                "view": "/htdocs/default.html",
                "controller": "/htdocs/controller/default.js"
            },
            {
                "viewid": "404",
                "view": "/htdocs/404.html",
                "controller": "/htdocs/controller/404.js"
            },
            {
                "viewid": "500",
                "view": "/htdocs/500.html",
                "controller": "/htdocs/controller/500.js"
            }
        ]
    }

.. note::

    Each view can have a different client-side controller.

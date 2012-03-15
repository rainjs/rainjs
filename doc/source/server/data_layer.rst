==========
Data Layer
==========

The data layer allows developers to pass custom data to the view templates. When the template is
executed it can use this data to construct dynamic markup. The data can be obtained by calling an
web service or it can be constructed inside the data layer function.

-----
Usage
-----

The parent can pass data to an aggregated component using the data attribute::

    {{component name="button" view="index" data="some data"}}

This data is passed to the data layer method as the second parameter. If the ``data.js`` file or
the method for the view doesn't exist, this data will become the context used to execute the
template associated with the aggregated component.

Data layer methods are placed in the ``/server/data.js`` file. In order to define a data
method for a view a function with the same name as the *view id* should be created in this file and
exported as part of the public API of this module.

This method receives two parameters. The first parameter is a callback that is called with two
parameters: an error (or ``null`` if no error occurred) and the custom data that will be passed
to the template. The second parameter of the data layer method is the data that was passed
to the component helper.

``/meta.json``

.. code-block:: javascript

    {
        "id": "button",
        "version": "1.0",
        "views": {
            "index" : {
                "view": "index.html",
                "controller": {
                    "client": "index.js",
                    "server": "index.js"
                }
            },
            "index1" : {
                "view": "index1.html",
                "controller": {
                    "client": "index1.js",
                    "server": "index1.js"
                }
            }
        }
    }

``/server/data.js``

.. code-block:: javascript

    function index(callback, data) {
        var customData = {
            field1: data,
            field2: 'value'
        };

        callback(null, customData);
    }

    function index1(callback, data) {
        getData(data, function (customData) {
            callback(null, customData);
        });
    }

    module.exports = {
        index: index,
        index1: index1
    };

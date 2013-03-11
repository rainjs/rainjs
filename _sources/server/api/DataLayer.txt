





..
    Classes and methods

Class DataLayer
================================================================================

..
   class-title


The data layer allows developers to pass custom data to the view templates. When the template is
executed it can use this data to construct dynamic markup. The data can be obtained by calling a
web service or it can be constructed inside the data layer function.

-----
Usage
-----

The Handlebars context in which the component helper was used is passed to the data layer method
in the ``context`` parameter. If the ``data.js`` file or the method for the view doesn't exist, this
data will become the context used to execute the template associated with the aggregated component.

Data layer methods are placed in the ``/server/data.js`` file. In order to define a data
method for a view a function with the same name as the *view id* should be created in this file and
exported as part of the public API of this module.

This method receives four parameters:
 - ``environment`` contains information about the RAIN environment;
 - ``callback`` represents a function that should be called after the custom data is constructed. It
   accepts two parameters: an error (or ``null`` if no error occurred) and the custom data;
 - ``context`` contains the Handlebars context in which the component was aggregated and the
   options that were passed to the component helper;
 - ``request`` has multiple properties:
     - ``session``: the session for the current request;
     - ``environment``: the environment instance for the current request;
     - ``idp``: the identity provider instance for the current request;
     - ``user``: the current user;
     - ``partials``: an array with the component's partial templates
       (e.g. ['file1', 'file2']; the extension for the file is not included);
     - ``query``: the query parameters for the current page;
     - ``headers``: the request headers;
     - ``url``: the URL of the current page;
     - ``type``: HTTP or WebSocket. When the component is requested via web sockets
       ``query``, ``headers`` and ``url`` are not available.

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

    function index(environment, callback, context, request) {
        var customData = {
            field1: data,
            field2: 'value'
        };

        callback(null, customData);
    }

    function index1(environment, callback, context, request) {
        getData(data, function (customData) {
            callback(null, customData);
        });
    }

    module.exports = {
        index: index,
        index1: index1
    };

.. seealso::

    :js:class:`Environment`
        Environment API








    


Constructor
-----------

.. js:class:: DataLayer()









Methods
-------

..
   class-methods


loadData
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: DataLayer#loadData(componentOpt, callback)


    
    :param Object componentOpt: 
        the component information 
    
    :param Object componentOpt.id: 
        the component id 
    
    :param Object componentOpt.version: 
        the component version 
    
    :param Object componentOpt.viewId: 
        the view id 
    
    :param Object componentOpt.context: 
        the current Handlebars context 
    
    :param Object componentOpt.session: 
        the session for the current request 
    
    :param Object componentOpt.[request]: 
        the current request object; this parameter is missing when the component is retrieved via web sockets 
    
    :param Function callback: 
        receives the error and data as parameter 
    




Validates all necessary parameters and invokes the data function from the component
to receive custom data. When the data returns, it calls the callback function.









    




    




=================
Cross Referencing
=================

Rain supports crossreferencing resources from other components such as CSS resources through the web component protocol.
How this works is that you prefix your resource with _webcomponent://_ folowed by the component name and version and
Rain will then properly generate a requirement, and get the resource for you.

Rain will automatically mash every resource reference together and return them as a single file to optimize the number of
calls to the server. 

A simple example would look like this:

.. code-block:: html
    :linenos:

    <link rel="stylesheet" type="text/css" href="webcomponent://toolbar;1.0/htdocs/css/main.css" /> 
    <link rel="stylesheet" type="text/css" href="webcomponent://cockpit;1.0/htdocs/css/main.css" />

---------------
Rendering Layer
---------------

The rendering layer takes care of rendering a pre-compiled template with a
data context. The data context is made available by the component's server-side
controller or by arguments passed from the parent template.

A handlebars helper with the following syntax is used for aggregating
components:

``{{component id opt-param-1 opt-param-2 opt-param-3="value" opt-param-4="value"}}``

As specified in Handlebars' documentation, a helper can receive parameters such
as ``opt-param-1`` and ``opt-param-2`` and/or key-value pairs. Parameters and
key values are treated as Handlebars Expressions. Please read Handlebars'
documentation for more information.

The helper is registered in Handlebars as such:

.. code-block:: javascript
   :linenos:

   Handlebars.registerHelper('component', function (id) {
       // 'id' is the component's identifier

       // Optional parameters are from the second to the penultimate argument
       var params = Array.prototype.slice.call(arguments, 1, -1);

       // Key-value pairs are stored in the last argument's 'hash' property
       var options = arguments[arguments.length - 1].hash;

       // ...
   }

The steps the rendering process goes through when rendering a component
(including the top-level one) are the following:

1. Asynchronous loading of the component's data is triggered

2. The data response arrives [#]_

3. Template begins rendering

   3.1. **{{css}}** helpers generate css dependencies and provide no output

   3.2. **{{component}}** helpers are rendered

        3.2.1. Generate *dom-id* for the current aggregation context

        3.2.2. Go to step 1 for this component

        3.2.3. Return HTML placeholder with generated *dom-id* for parent component [#]_

4. Send rendered component to the client via websocket along with the list
   of CSS dependencies, the client-side JS controller and its *dom-id* [#]_

5. Insert the component into the document

   5.1. Insert CSS dependencies into the HEAD of the document

   5.2. Require the JS controller to be loaded (via requireJS)

   5.3. Insert the received HTML rendered content into the correct
        placeholder according to the received *dom-id*

.. image:: ../images/proposals/rendering_layer.jpg
   :scale: 70%

.. rubric:: Footnotes

.. [#] In the meantime, the server is free to process other things
.. [#] Since step 1 of the process starts an asynchronous call, step 3.2.3. is
       immediately reachable and the **{{component}}** renderer can quickly return a
       placeholder to the parent component
.. [#] The *dom-id* for the top-level component has a special value
       that triggers that component's rendered content to be inserted into the
       document's BODY rather than into a specific placeholder 

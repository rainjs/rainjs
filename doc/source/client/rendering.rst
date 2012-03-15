=========
Rendering
=========

The rendering process in Rain is an asynchronous process. Each component is sent 
to the client as soon as its content is ready. First a placeholder is sent for the 
component. This placeholder displays a loading icon. When the content is ready
the placeholder is replaced with the actual markup for the component.

The whole rendering process consists of 3 layers:

#. Template Compiler: the view templates are compiled when the server starts.
#. Data Layer: constructs the data that will be used to execute the compiled template.
#. Renderer: in this step the compiled template is executed using the data provided by the data layer.

----------
Life Cycle
----------

The lifecycle in Rain contains 4 stages: ``init``, ``start``, ``error`` and ``destroy``.
You can execute code in each of this stages by adding a method with the same name in the
client-side controller.

The ``init`` method is called when the controllor object is constructed. At this stage
the markup for the component is not yet in place. 

The ``start`` method is called after the markup is inserted in the DOM. At this stage you can
manipulate the markup of the component.

The ``error`` method is called just before start if the data layer encountered an error. At this
stage the markup of the component is in place. This method receives the error as parameter.

The ``destroy`` method is invoked when the component is removed from the page.

.. seealso::
    
    :doc:`../server/data_layer`
        Documentation describing how the data layer works
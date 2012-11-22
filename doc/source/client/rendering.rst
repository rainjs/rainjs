=========
Rendering
=========

The rendering process in RAIN is an asynchronous process. Each component is sent to the client as
soon as its content is ready. First a placeholder is sent for the component. This placeholder
displays a loading icon. When the content is ready, the placeholder is replaced with the actual
markup for the component.

The whole rendering process consists of 3 parts:

#. Template Compiler: the view templates are compiled when the server starts.
#. Data Layer: constructs the data that will be used to execute the compiled template.
#. Renderer: in this step the compiled template is executed with the data from the data layer.

---------------
Transport Layer
---------------

The transport layer is the bridge between the rendering process that happens on the server and the
client rendering engine. When the user makes a request, the RAIN server first sends the bootstrap
which contains the basic HTML markup for the page, the client rendering engine and the RequireJS
and jQuery libraries. The HTTP connection is kept open and the components are sent to the client
when they are ready. The connection is closed after the last component was sent.

The components are sent to the client as JSON objects. These objects contains the markup
for the component, the css dependencies and the client-side controller path. The client rendering
engine receives the JSON and adds the component to the page.

-------------------
Component lifecycle
-------------------

The lifecycle in RAIN contains 4 stages: ``init``, ``start``, ``error`` and ``destroy``. You can
execute code in each of this stages by adding a method with the same name in the client-side
controller. After these methods end their execution an event with the same name is emitted.

Other components can listen to these events, so that they know when it's safe to use their API or
when something changed with the component. Because the lifecycle methods can have asynchronous
logic we have to have a way to let the framework know when the component should change the state.

For this we have implemented the following logic:

- the lifecycle method is synchronous if it doesn't return a value. The event will be emitted
  immediately.
- the lifecycle method is asynchronous if it returns a ``Promise``. This promise will be resolved
  internally by the developer and the framework will wait for that before changing the component
  lifecycle state. The event will be emitted after the promise was resolved.

The ``init`` method is called when the controller object is constructed. At this stage the markup
for the component is not yet in place.

The ``start`` method is called after the markup is inserted in the DOM. At this stage you can
manipulate the markup of the component.

The ``error`` method is called just before start if the data layer encountered an error. At this
stage the markup of the component is in place. This method receives the error as parameter.

The ``destroy`` method is invoked when the component is removed from the page.

.. seealso::

    :doc:`../server/api/DataLayer`
        Documentation describing how the data layer works

    :doc:`client_rendering`
        Describes how the Client Rendering works

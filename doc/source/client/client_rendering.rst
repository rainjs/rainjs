================
Client rendering
================

Client rendering is the process of loading components from the server-side and displaying
them on the client-side. As a developer you want to load components at any step in your
application's lifecycle.

Using the ``ClientRenderer`` public methods you can load components and include them anywhere
in your page. RAIN does all the work of getting all the necessary data from the server-side
and invoking the component's lifecycle.

-----
Usage
-----

To load a component you have to use the global object ``clientRenderer``. This object is a
singleton instance of :js:class:`ClientRenderer`.

The following code loads a *user_configuration* component. The component is added after
the jQuery selector *my-div*.

.. code-block:: javascript

    clientRenderer.loadComponent({
        selector: '#my-div',
        component: {
            name: 'user_configuration',
            version: '1.0',
            view: 'index'
        }
    });

.. seealso::

    :js:class:`ClientRenderer`
        Client renderer API

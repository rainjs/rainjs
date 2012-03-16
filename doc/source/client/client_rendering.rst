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

The following code requests a *button* component. The ``instanceId`` property indicates
where the markup of the component should be placed in the page.

.. code-block:: javascript

    clientRenderer.requestComponent({
        component: {
            name: 'button',
            version: '1.0',
            view: 'index',
            instanceId: "f1db15e2d25be2697f2cc02e63fce03f39705811"
        }
    });

.. seealso::

    :js:class:`ClientRenderer`
        Client renderer API

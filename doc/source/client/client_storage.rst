..
    Classes and methods

Client storage API
================================================================================

..
   class-title


This is our custom implementation of client storage. The way this works is that it provides a transparent API for you to use, in order to
be able to work with client data. The API is attached to the controller's view context. An example would be:

.. code-block:: javascript
    :linenos:

    this.context.storage.set('cart', { items: [1, 2, 3, 4], total: 10});
    var data = this.context.storage.get('cart');
    console.log(data);

and it will print:

.. code-block:: guess
    :linenos:

    {
        items: [1, 2, 3, 4],
        total: 10
    }



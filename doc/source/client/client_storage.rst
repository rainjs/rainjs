..
    Classes and methods

Client storage API
================================================================================

..
   class-title


This is our custom implementation of client storage. The way this works is that it provides a transparent API for you to use, in order to
be able to work with client data. The API is attached to the controller's view context. An example would be::

    this.viewContext.storage.set('cart', { items: [1, 2, 3, 4], total: 10});
    var data = this.viewContext.storage.get('cart');
    console.log(data);

and it will print::

    {
        items: [1, 2, 3, 4],
        total: 10
    }











Constructor
-----------

.. js:class:: ClientStorage()









Methods
-------

..
   class-methods


set
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ClientStorage#set(key, value, [isTransient])



    :param String key:


    :param Object value:


    :param Boolean isTransient:
        whether to use persistent storage or transient storage (defaults to false)




    :throws Error:
        : if client storage is not supported




Set the value of key (add it if key doesn't exist) into storage


















get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ClientStorage#get(key, [isTransient])



    :param String key:


    :param Boolean isTransient: 
        whether to use persistent storage or transient storage (defaults to false)




    :throws Error:
        : if client storage is not supported




    :returns String|Boolean:
        the value of key or null on failure



Retrieves the value of key from storage













remove
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ClientStorage#remove(key, [isTransient])



    :param String key:


    :param Boolean isTransient:
        whether to use persistent storage or transient storage (defaults to false) 




    :throws Error:
        : if client storage is not supported




Remove the key from storage














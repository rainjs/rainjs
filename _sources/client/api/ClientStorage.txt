





..
    Classes and methods

Class ClientStorage
================================================================================

..
   class-title


Creates a new client storage for the current context.

It provides methods to work with the client data. The storage methods can be used directly
from the the controller's context through the *storage* key.








    

Examples
--------


.. code-block:: javascript

    this.context.storage.set('cart', { items: [1, 2, 3, 4], total: 10});
    var data = this.context.storage.get('cart');
    console.log(data);

    // That will print
    //     {
    //         items: [1, 2, 3, 4],
    //         total: 10
    //     }



Constructor
-----------

.. js:class:: ClientStorage(context)



    
    :param Context context: 
        the context of the component. 
    







Methods
-------

..
   class-methods


get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ClientStorage#get(key, [isTransient])


    
    :param String key: 
        the key 
    
    :param Boolean isTransient: 
        whether to use persistent storage or transient storage (*Default*: 'false')
    



    
    :returns Object:
        the key value 
    


Retrieves the value of a key from storage.









    



remove
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ClientStorage#remove(key, [isTransient])


    
    :param String key: 
        the key 
    
    :param Boolean isTransient: 
        whether to use persistent storage or transient storage (*Default*: 'false')
    




Removes a key from storage.









    



set
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ClientStorage#set(key, value, [isTransient])


    
    :param String key: 
        the key 
    
    :param Object value: 
        the value 
    
    :param Boolean isTransient: 
        whether to use persistent storage or transient storage (*Default*: 'false')
    




Sets the value of a key (add it if key doesn't exist) into storage.









    




    




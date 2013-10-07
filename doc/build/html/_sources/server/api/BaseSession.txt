





..
    Classes and methods

Class BaseSession
================================================================================

..
   class-title


Get / set and remove session keys from / to the session store.
It keeps track of the updated and removed keys, information that is used by the session store
to make partial updates.








    


Constructor
-----------

.. js:class:: BaseSession(session, componentId)



    
    :param Object session: 
        the session objects for the specified component 
    
    :param String componentId: 
        the component configuration 
    







Methods
-------

..
   class-methods


get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: BaseSession#get(key)


    
    :param String key: 
        the key 
    



    
    :returns Object:
        the value 
    


Get the value associated with the specified key.









    



isDirty
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: BaseSession#isDirty()




    
    :returns Boolean:
         
    


Verifies if there were any changes in the current session.









    



isEmpty
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: BaseSession#isEmpty()




    
    :returns Boolean:
         
    


Indicates if this session has data in the store.









    



remove
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: BaseSession#remove(key)


    
    :param String key: 
        the key 
    




Remove the specified key from the session.









    



removeAll
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: BaseSession#removeAll()





Remove all keys.









    



set
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: BaseSession#set(key, the)


    
    :param String key: 
        the key to save 
    
    :param Object the: 
        key's value 
    




Sets a value for the specified key.









    




    




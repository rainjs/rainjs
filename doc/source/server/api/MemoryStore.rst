





..
    Classes and methods

Class MemoryStore
================================================================================

..
   class-title


Session store implementation using memory store.

Add the following options to configuration to use it::

      "session": {
          "store": "./lib/session/stores/memory"
      }








    


Constructor
-----------

.. js:class:: MemoryStore([storeConfig])



    
    :param Object storeConfig: 
        the store configuration 
    







Methods
-------

..
   class-methods


createNewSession
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: MemoryStore#createNewSession(sessionId)


    
    :param String sessionId: 
        - the sessionId 
    



    
    :returns Promise:
         
    


Generates an empty session associated with the sessionId in the store and the promise is
resolved with the created session.
If the session can't be created the promise is rejected.









    



destroy
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: MemoryStore#destroy(sessionId)


    
    :param String sessionId: 
        the session id 
    



    
    :returns Promise:
        the promise is resolved if the session was destroyed successfully,
else it is rejected. 
    


Destroys the session associated with the specified session id.









    



get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: MemoryStore#get(sessionId, [componentId])


    
    :param String sessionId: 
        - the session id 
    
    :param String componentId: 
        - the component's id 
    



    
    :returns Promise:
         
    


Gets the session instance associated with session id and component id. If component id is
missing then the global session is retrieved.









    



save
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: MemoryStore#save(session, returns)


    
    :param Session session: 
        the session to save 
    
    :param Promise returns: 
        a rejected promise if error, else the promise is resolved. 
    




Saves the specified session instance. Only the keys marked as dirty are saved.









    




    




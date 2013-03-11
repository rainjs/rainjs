





..
    Classes and methods

Class BaseSessionStore
================================================================================

..
   class-title


The class creates, saves and destroys sessions. It describes the methods that have to be
implemented when designing a session store in order to work with the rest of RAIN middleware.








    


Constructor
-----------

.. js:class:: BaseSessionStore([storeConfig])



    
    :param Object storeConfig: 
        the store configuration 
    







Methods
-------

..
   class-methods


createNewSession
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: BaseSessionStore#createNewSession(sessionId)


    
    :param String sessionId: 
         
    



    
    :returns Promise:
         
    


Creates an empty session associated with the session id in the store.









    



destroy
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: BaseSessionStore#destroy(sessionId, )


    
    :param String sessionId: 
        the session id 
    
    :param Promise : 
         
    




Destroys the session associated with the specified session id.









    



get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: BaseSessionStore#get(sessionId, [componentId])


    
    :param String sessionId: 
        the session id 
    
    :param String componentId: 
        the component for which to get the session. 
    



    
    :returns Promise:
        a promise that will be resolved with the session. 
    


Gets the session instance associated with session id and component id. Retrieves the global
session if component id is missing.









    



save
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: BaseSessionStore#save(session)


    
    :param Session session: 
        the session that will be saved 
    



    
    :returns Promise:
         
    


Saves the specified session instance. Only the keys marked as dirty are saved.









    




    




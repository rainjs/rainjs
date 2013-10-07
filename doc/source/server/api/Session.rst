





..
    Classes and methods

Class Session
================================================================================

..
   class-title


Creates a new session object.








    


Constructor
-----------

.. js:class:: Session(options)



    
    :param Object options: 
        the session options 
    







Methods
-------

..
   class-methods


getHandle
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Session.getHandle(options)


    
    :param Object options: 
        the session options 
    



    
    :returns Function:
        the middleware handle function 
    


Get the session middleware function.









    



handle
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Session#handle(request, response, next)


    
    :param Request request: 
        the request object 
    
    :param Response response: 
        the response object 
    
    :param Function next: 
        callback passed by connect that execute the next middleware when called 
    




Handle function for the session middleware.









    




    




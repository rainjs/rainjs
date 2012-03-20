





..
    Classes and methods

Namespace Authorization
================================================================================

..
   class-title


Provides methods that validate the user's permissions against the defined authorization rules








    


Constructor
-----------

.. js:class:: Authorization









Methods
-------

..
   class-methods


authorize
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Authorization.authorize(securityContext, permissions, dynamicConditions)


    
    :param Object securityContext: 
        the security context 
    
    :param Object securityContext.user: 
        the user to authorize 
    
    :param Array permissions: 
        the permissions required to access a resource 
    
    :param Array dynamicConditions: 
        the dynamic conditions to execute 
    



    
    :returns Boolean:
        the result of the authorization checks 
    


Checks if an user is allowed to access a resource.









    




    




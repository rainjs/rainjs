





..
    Classes and methods

Class IdentityProvider
================================================================================

..
   class-title


Abstract identity provider class. Authenticates the user and stores/retrieves the user information
to/from session.

Implementations of this class should override two methods:
     - ``_authenticate``: provides an implementation for user authentication.
     - ``_getUserClass``: returns the constructor for the user class (the default implementation
       returns the constructor for the base user class).








    


Constructor
-----------

.. js:class:: IdentityProvider(session)



    
    :param Session session: 
        the session for which to create the identity provider instance 
    







Methods
-------

..
   class-methods


get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: IdentityProvider.get(session)


    
    :param Session session: 
        the session for which to create the identity provider instance 
    



    
    :returns IdentityProvider:
        an IdentityProvider instance 
    


Reads the path of the actual identity provider implementation and creates a new instance.









    



getUser
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: IdentityProvider#getUser()




    
    :returns User:
        the user object 
    


Gets the user associated with the current session.









    



login
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: IdentityProvider#login(username, password)


    
    :param String username: 
        the username 
    
    :param String password: 
        the password 
    



    
    :returns Promise:
        a promise that resolves with the user object 
    


Authenticates the user and stores the user object on the session.









    



logout
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: IdentityProvider#logout()




    
    :returns Promise:
        a promise that is resolved after the session is destroyed 
    


Destroys the session.









    



updateUser
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: IdentityProvider#updateUser()





Sets the user back on the session object if it was modified.









    




    




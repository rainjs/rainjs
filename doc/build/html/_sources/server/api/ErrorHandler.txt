





..
    Classes and methods

Class ErrorHandler
================================================================================

..
   class-title


Creates the ErrorHandler and loads the specified / default error component.








    


Constructor
-----------

.. js:class:: ErrorHandler()




    
    :throws RainError:
        : when the error component is not specified or if it doesn't have the default view
    






Methods
-------

..
   class-methods


getErrorComponent
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ErrorHandler#getErrorComponent(statusCode)


    
    :param Integer statusCode: 
        the status code for the error 
    



    
    :returns Object:
        The component and view for the status code 
    


Renders an error view from a given status code.









    




    




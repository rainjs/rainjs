





..
    Classes and methods

Class StackTraceFormatter
================================================================================

..
   class-title


Cross-browser stack trace formatter.
Supports Firefox, Chrome, IE and Safari as well as node.js.

Note: it currently does not aim to reproduce the same stack trace
for every browser.








    


Constructor
-----------

.. js:class:: StackTraceFormatter(error)



    
    :param Error error: 
        the thrown error 
    







Methods
-------

..
   class-methods


format
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: StackTraceFormatter#format()




    
    :returns String:
        the formatted stack trace 
    


Formats the stack trace for a meaningful inspection.
Removes the inner functions from RAIN that appear at the top of the stack
and ensures cross-browser functionality (e.g. IE support).









    




    

Attributes
----------

..
   class-attributes


error
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: error   











    



implementation
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: implementation   


the stack formatter implementation used








    







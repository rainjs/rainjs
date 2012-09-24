





..
    Classes and methods

Class FlowLayout
================================================================================

..
   class-title


Implements flow layout behavior.
Inside a flow layout, items float from left to right.








    


Constructor
-----------

.. js:class:: FlowLayout()


    Bases: :js:class:`Layout` 








Methods
-------

..
   class-methods


count
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: FlowLayout#count()



    
    :throws RainError:
        : if start wasn't executed when the method was called
    


    
    :returns Number:
        the number of items 
    


Gets the number of existing items.









    



remove
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: FlowLayout#remove(options)


    
    :param Object options: 
        configuration to identify the item block to be removed 
    
    :param Number options.index: 
        the index to remove 
    


    
    :throws RainError:
        : if start wasn't executed when the method was called
    



Removes an item from the layout.









    




    




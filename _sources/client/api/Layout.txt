





..
    Classes and methods

Class Layout
================================================================================

..
   class-title


Abstract controller for layout controllers.

Implements functionality to add and remove items to the layout.
Subclass to implement specific client behavior.








    


Constructor
-----------

.. js:class:: Layout()









Methods
-------

..
   class-methods


add
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Layout#add(content, options, [callback])


    
    :param Object|String content: 
        the component or markup to insert 
    
    :param String content.id: 
        the component id 
    
    :param String content.version: 
        the component version 
    
    :param String content.view: 
        the component view id 
    
    :param String content.sid: 
        the component staticId id 
    
    :param Object content.context: 
        custom data for the component 
    
    :param Boolean content.placeholder: 
        enable / disable placeholder 
    
    :param Object options: 
        specific configuration for the content's item block 
    
    :param Function callback: 
        a function that will be called after the content was added 
    




Adds content to the layout.









    



remove
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Layout#remove(options)


    
    :param Object options: 
        configuration to identify the item block to be removed 
    




Removes an item from the layout.









    




    




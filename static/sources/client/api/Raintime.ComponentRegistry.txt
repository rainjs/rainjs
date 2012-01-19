





..
    Classes and methods

Class Raintime.ComponentRegistry
================================================================================

..
   class-title











    


Constructor
-----------

.. js:class:: Raintime.ComponentRegistry()









Methods
-------

..
   class-methods


deregister
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Raintime.ComponentRegistry#deregister(id)


    
    :param Mixed id: 
        the id of the component to remove 
    




Deregisters a component from the registry









    



get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Raintime.ComponentRegistry.get()




    
    :returns ComponentRegistry:
         
    


Get an instance of the ComponentRegistry









    



getComponent
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Raintime.ComponentRegistry#getComponent(staticId)


    
    :param Mixed staticId: 
         
    



    
    :returns Component|undefined:
         
    


Get a component by its static Id









    



register
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Raintime.ComponentRegistry#register(props)


    
    :param Object props: 
        Properties of the component: renderer_id, domId, instanceId, domselector, clientcontroller 
    



    
    :returns Component:
         
    


Registers a component to the registry









    




    

Attributes
----------

..
   class-attributes


components
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: components   


An array of the registered components








    







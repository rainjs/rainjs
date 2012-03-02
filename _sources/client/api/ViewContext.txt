





..
    Classes and methods

Class ViewContext
================================================================================

..
   class-title


A view context reflects a components client-side state.








    


Constructor
-----------

.. js:class:: ViewContext(component)



    
    :param Object component: 
         
    
    :param String component.id: 
         
    
    :param Object component.parent: 
         
    
    :param String component.moduleId: 
         
    







Methods
-------

..
   class-methods


getRoot
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ViewContext#getRoot()




    
    :returns jQueryElement:
        The component's container jQuery element 
    


Returns the DOM container element for the component associated with this
view context.









    



getWebSocket
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ViewContext#getWebSocket(url)


    
    :param  url: 
         
    



    
    :returns Socket:
         
    


Method used to obtain a web socket for which a handler was defined into this
component.









    



publish
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ViewContext#publish(eventName, data)


    
    :param String eventName: 
         
    
    :param Object data: 
         
    




This is the method that will publish an event and will execute all registered callbacks.









    



subscribe
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ViewContext#subscribe(eventName, callback)


    
    :param String eventName: 
        Event name we want to subscribe to. Can be any string value. 
    
    :param Function callback: 
        This is the callback method that will get executed. It must have a single parameter called data. e.g.: function(data) 
    




This is the method that allows registration of a callback method to a
desired event.









    



unsubscribe
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ViewContext#unsubscribe(eventName, callback)


    
    :param String eventName: 
        Event name we want to subscribe to. Can be any string value. 
    
    :param Function callback: 
        This is the callback method that will get executed. It must have a single parameter called data. e.g.: function(data) 
    




Unsubscribe from an event.









    




    

Attributes
----------

..
   class-attributes


instanceId
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: instanceId   


The component's instance id








    



moduleId
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: moduleId   


The component's module id








    



parent
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: parent   











    



storage
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: storage   


The local storage manager








    



viewManager
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: viewManager   


The view manager that handles subsequent view requests








    













..
    Classes and methods

Class AsyncController
================================================================================

..
   class-title


This class contains utility functions that a component's client side controller can use to
get references to the controllers of its direct children. Every controller inherits these
methods by default.








    


Constructor
-----------

.. js:class:: AsyncController()









Methods
-------

..
   class-methods


_getChild
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: AsyncController#_getChild(sid)


    
    :param String sid: 
        the child component's static id 
    



    
    :returns Promise:
        a promise to return the child controller after it has started 
    


Asynchronously waits for a child controller to become available and start.
The started controllers are cached. If the controller is found in the cache, the promise
is resolved at the next tick.

If the child with the specified sid is not found, the promise is rejected with a RainError.









    



_getChildren
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: AsyncController#_getChildren([sids])


    
    :param Array sids: 
        the static ids of the controllers that needed to be started 
    



    
    :returns Promise:
        a promise to load and start the controllers 
    


Asynchronously loads multiple started controllers. If the 'sids' argument is missing, then
the method waits for all children (with a sid value non-empty) of the current component to
start.

The promise will be resolved with an object where the keys are the controllers' sids and
the values are the controller objects.









    



_onChild
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: AsyncController#_onChild(sid, eventName, eventHandler)


    
    :param String sid: 
        the component's static id 
    
    :param String eventName: 
        the event's name 
    
    :param Function eventHandler: 
        the event handler function 
    




Convenience method to bind an event handler to a controller and make sure the controller
is started first.









    




    




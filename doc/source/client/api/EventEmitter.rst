





..
    Classes and methods

Class EventEmitter
================================================================================

..
   class-title


When an EventEmitter instance experiences an error, the typical action is to emit an 'error' event.
Error events are treated as a special case in node.
If there is no listener for it, then the default action is to print a stack trace and exit the program.
All EventEmitters emit the event 'newListener' when new listeners are added.








    


Constructor
-----------

.. js:class:: EventEmitter()









Methods
-------

..
   class-methods


addListener
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: EventEmitter#addListener(type, listener)


    
    :param String type: 
        The event name 
    
    :param Function listener: 
        The listener function 
    



    
    :returns EventEmitter:
         
    


Adds a listener to the end of the listeners array for the specified event.









    



emit
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: EventEmitter#emit(event, [arg,arg2])


    
    :param String event: 
        The event name 
    
    :param  arg,arg2: 
        The arguments to pass 
    




Execute each of the listeners in order with the supplied arguments.









    



listeners
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: EventEmitter#listeners(type)


    
    :param String type: 
        The event name 
    



    
    :returns EventEmitter:
        Instance 
    


Returns an array of listeners for the specified event.
This array can be manipulated, e.g. to remove listeners.









    



on
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: EventEmitter#on()













.. seealso::

    EventEmitter#addListener



    



once
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: EventEmitter#once(type, listener)


    
    :param String type: 
        The event name 
    
    :param Function listener: 
        The listener function 
    



    
    :returns EventEmitter:
        Instance 
    


Adds a one time listener for the event.
This listener is invoked only the next time the event is fired, after which it is removed.









    



removeAllListeners
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: EventEmitter#removeAllListeners(type)


    
    :param String type: 
        The event name 
    



    
    :returns EventEmitter:
        Instance 
    


Removes all listeners, or those of the specified event.









    



removeListener
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: EventEmitter#removeListener(type, listener)


    
    :param String type: 
        The event name 
    
    :param Function listener: 
        The listener function 
    



    
    :returns EventEmitter:
        Instance 
    


Remove a listener from the listener array for the specified event.
**Caution**: changes array indices in the listener array behind the listener.









    



setMaxListeners
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: EventEmitter#setMaxListeners(n)


    
    :param Number n: 
         
    




By default EventEmitters will print a warning if more than 10 listeners are added for a particular event.
This is a useful default which helps finding memory leaks.
Obviously not all Emitters should be limited to 10. This function allows that to be increased.
Set to zero for unlimited.









    




    










..
    Classes and methods

Class Raintime.messaging
================================================================================

..
   class-title


Class used to build the messaging layer.








    


Constructor
-----------

.. js:class:: Raintime.messaging()









Methods
-------

..
   class-methods


publish
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Raintime.messaging.publish(eventName, data, viewContext)


    
    :param  eventName: 
         
    
    :param  data: 
         
    
    :param  viewContext: 
        the ViewContext of the component publishing the event 
    




This is the method that will publish an event
and will execute all registered callbacks.









    



sendIntent
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Raintime.messaging.sendIntent(request, defer)


    
    :param Dictionary request: 
        This is the request object for this intent. 
    
    :param Promise defer: 
         
    


    
    :throws Error:
        : if request object is incomplete then sendIntent raises an error.
    


    
    :returns Promise:
        A promise that provide then method. You can use it for react to success and error situations. 
    


Method used to send an intent request.









    



subscribe
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Raintime.messaging.subscribe(eventName, callback, viewContext)


    
    :param  eventName: 
        Event name we want to subscribe to. Can be any string value. 
    
    :param  callback: 
        This is the callback method that will get executed. It must have
					a single parameter called data. 
			Ex: function(data) 
    
    :param  viewContext: 
        the ViewContext of the component publishing the event 
    




This is the method that allows registration of a callback method to a 
desired event.









    



unsubscribe
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Raintime.messaging.unsubscribe(eventName, callback, viewContext)


    
    :param  eventName: 
        Event name we want to subscribe to. Can be any string value. 
    
    :param  callback: 
        This is the callback method that will get executed. It must have
                    a single parameter called data.
            Ex: function(data) 
    
    :param  viewContext: 
        the ViewContext of the component publishing the event 
    




Unsubscribe from an event









    




    




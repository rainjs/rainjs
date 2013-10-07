





..
    Classes and methods

Class MonitoringAdapter
================================================================================

..
   class-title


Abstract monitoring provider class.








    


Constructor
-----------

.. js:class:: MonitoringAdapter(options)



    
    :param Object options: 
        the options used to initialize the adapter 
    







Methods
-------

..
   class-methods


get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: MonitoringAdapter.get()




    
    :returns MonitoringAdapter:
        the singleton instance 
    


Returns the singleton instance. Returns null when no configuration was specified for the
adapter.









    



sendData
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: MonitoringAdapter#sendData(data)


    
    :param  data: 
         
    




Sends data to monitoring tool.









    




    










..
    Classes and methods

Class Monitoring
================================================================================

..
   class-title


Monitoring module. Populates a measurement map depending on useCases, if the useCases are disabled
than they are not added to the measurement map. The monitoring module will not work / will be disabled
in the following situation:
- the monitoring configuration is missing;
- the adapter module instance is missing or could not be initialized;
- the monitoring metrics key is missing;
- the disabled key in the monitoring configuration;

The monitoring module creates a measurementMap that would look like this:








    

Examples
--------


.. code-block:: javascript

    "useCase1": {
         key:'zabbixUniqueKey',
         operation: 'count'/'average',
         secondaryKey: 'secondaryZabbixKey',
         step: {Number}
         measurements: {
             activeRequests: {Number},
             resolvedRequests: {Number},
             total: {Number},
             registered: {Boolean},
             start: {Time},
             end: {Time},
             uniqueId1: {
                 time: {Number},
                 end: {Boolean},
              }
              uniqueId2: {
                  time: {Number},
                  end: {Boolean},
              }
         }
     }

**key** - Mandatory. The unique zabbix server key.
**operation** - Mandatory. The operation to be done on a specific use case. Posibilities are: ``count`` and
``average``
**secondaryKey** - Optional. Only present if the operation set for the use case is ``average``. Otherwise
it will not be taken into consideration.
**step** - Optional. If present it will over write the interval of sending for the use case it is set. If
not present the interval is the global one.
**measurements** - Generated object on the first ``startMeasurement`` or ``registerEvent`` method call.
**activeRequests** - Generated on the first ``startMeasurement`` or ``registerEvent`` method call.
Incremented on ``startMeasurement`` or ``registerEvent`` call and decremented on ``endMeasurement`` call.
This key is reset only for registered events.
**resolvedRequests** - Generated on the first ``startMeasurement`` method call. Incremented on
``endMeasurement`` call. The value is reset after every successfull send.
**total** - Generated on the first ``startMeasurement`` method call only for the use cases with the
operation ``average``. It represents the total time spent for resolving requests in a period time.
**registered** - Generated on the first ``registerEvent`` method call. It signals that the current
measurement is special and it has been registered not traditional ``startMeasurement``, ``endMeasurement``
process. Flag is used in the logic of the data reset.
**start** - Generated at every ``startMeasurement``, represents the time when the measurement was last started.
Needed for the logic of sending data. If no ``startMeasurement`` has been executed in that interval of time
than data for that use case will not be sent.
**end** - Generated at every ``endMeasurement``, represents the time when the measurement was last ended.
Needed for the logic of sending data. If no ``endMeasurement`` has been executed in that interval of time
than data for that use case will not be sent.
**uniqueId**1,2 - Set only for the usecases that have ``average`` operation set at the first ``startMeasurement``
method call. This id will be passed or will be automatically generated internaly using crypto. U should always
use an unique id. The id is not reusable, you can only end a measurement for a specific id, after that it
will be deleted.
**time** - Set only for unique Ids in use cases with ``average`` operation. Represents the time when
the ``startMeasurement`` was called for that specific id. Needed to calculate the time of a resolved
request.
**end** - Set only for unique Ids in use cases with ``average`` operation. Flags the id that it can
be deleted when ``resetData`` is called.



Constructor
-----------

.. js:class:: Monitoring()




    
    :throws RainError:
        : if any use case misses the mandatory zabbix key or the operation.
    






Methods
-------

..
   class-methods


close
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Monitoring#close()




    
    :returns Promise:
        when all ongoing writes to zabbix server are finished. 
    


Writes all the collected data to the Monitoring Server. No more monitoring can be done
after calling this method.









    



endMeasurement
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Monitoring#endMeasurement(configKey, [id])


    
    :param String configKey: 
        the name of the use case. 
    
    :param String id: 
        the unique measurement id. 
    




End of measurement for a specific use case. Logs errors if the use case key is missing, the specified
use case is not present in the metrics configuration, the specified id is not present in the measurement
map or there was no measurement started before the ``endMeasurement`` was called.









    



get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Monitoring.get()




    
    :returns Monitoring:
        instance of the Monitoring class. 
    


Singleton getter.









    



registerEvent
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Monitoring#registerEvent(configKey)


    
    :param String configKey: 
        useCase for which to gather data. 
    




Collecting other types of monitoring data not depending on ``startMeasurement`` and ``endMeasurement``
methods, this method can be called only for the use cases that have a ``count`` operation.









    



startMeasurement
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Monitoring#startMeasurement(configKey, [id])


    
    :param String configKey: 
        the name of the use case. 
    
    :param String id: 
        the unique measurement id. 
    



    
    :returns String:
        id the unique measurement id. 
    


Start of the measurement for a specific useCase with an unique id. Logs errors if the use case
is missing or the specified useCase is not present in the metrics configuration. If no measurement
was started before for an use case it registers a measurement key in the measurement map. Please
see the class documentation for the parameters set by this method.









    




    




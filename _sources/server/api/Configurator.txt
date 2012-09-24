





..
    Classes and methods

Class Configurator
================================================================================

..
   class-title


Reads the configuration and creates the appenders and layouts for both platform and components.








    


Constructor
-----------

.. js:class:: Configurator()









Methods
-------

..
   class-methods


get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Configurator.get()




    
    :returns Configurator:
         
    


Gets the configurator instance.









    



getAppenders
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Configurator#getAppenders([component])


    
    :param  component: 
        The component for which to create the appenders. 
    
    :param  component.id: 
        The component id. 
    
    :param  component.version: 
        The component version. 
    


    
    :throws RainError:
        : when the platform level is invalid.
    


    
    :returns Array[Appender]:
        the appender list 
    


Initializes the appenders for a specific component or for the platform.









    




    

Attributes
----------

..
   class-attributes


CUSTOM_TYPE
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: CUSTOM_TYPE (static)(constant)  


A constant which indicates that a custom appender or layout is used.








    







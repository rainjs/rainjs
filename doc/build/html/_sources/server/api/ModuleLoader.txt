





..
    Classes and methods

Class ModuleLoader
================================================================================

..
   class-title


Module loader for the server side code of RAIN components. Adds custom properties to the
module context. This class is a singleton.








    


Constructor
-----------

.. js:class:: ModuleLoader()









Methods
-------

..
   class-methods


get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ModuleLoader.get()




    
    :returns ModuleLoader:
         
    


Gets the singleton instance.









    



requireWithContext
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ModuleLoader#requireWithContext(modulePath, component, language)


    
    :param String modulePath: 
        absolute path for the module to be loaded 
    
    :param Object component: 
        the component for which to generate the context 
    
    :param String language: 
        the language for which to generate the context 
    



    
    :returns Object:
        the exported module 
    


Load a module that will run in a new context to which ``t``, ``nt`` and ``logger``
properties are added.









    




    




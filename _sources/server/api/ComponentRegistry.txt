





..
    Classes and methods

Class ComponentRegistry
================================================================================

..
   class-title


Keeps components configuration and exposes an interface to obtain information about them.








    


Constructor
-----------

.. js:class:: ComponentRegistry()









Methods
-------

..
   class-methods


getConfig
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ComponentRegistry#getConfig(id, version)


    
    :param String id: 
        the id of the component 
    
    :param String version: 
        the version of the component 
    



    
    :returns Object:
        the component configuration 
    


Gets the configuration for a component.









    



getLatestVersion
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ComponentRegistry#getLatestVersion(componentId, [fragment])


    
    :param String componentId: 
        the id of the component 
    
    :param String fragment: 
        a version fragment 
    



    
    :returns String:
        the latest version of the component of undefined if it isn't found 
    


Returns the latest version for a component. This method also supports
specifying version fragments in the second optional parameter. This means
that if the provided version is "1", it will return the latest version that
has "1" as its major version (like "1.8.5"). You can also specify an exact
version in the fragment. If the component isn't found, it returns undefined.
Also, if you provide a fragment that it is too big, it will return undefined
(like 3.2 and the latest version is 2.5.3).









    



initialize
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ComponentRegistry#initialize(config)


    
    :param Configuration config: 
        Instance of configuration module 
    



    
    :returns ComponentRegistry:
        the class instance 
    


Registers the components, holds their configuration configures the plugins.









    




    

Attributes
----------

..
   class-attributes


COMPONENT_METAFILE
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: COMPONENT_METAFILE (static)  


The name of the component configuration file. It is a constant.








    







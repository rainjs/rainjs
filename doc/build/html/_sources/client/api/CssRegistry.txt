





..
    Classes and methods

Class CssRegistry
================================================================================

..
   class-title


Manages the stylesheets inside the page keeping track of where each CSS file is and
cleaning up the remaining whitespace when necessary.








    


Constructor
-----------

.. js:class:: CssRegistry()









Methods
-------

..
   class-methods


get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: CssRegistry.get()




    
    :returns CssRenderer:
        the singleton instance 
    


Returns the singleton instance.









    



getNewFiles
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: CssRegistry#getNewFiles(component, files)


    
    :param String component: 
        the component id to which the files belong 
    
    :param Array files: 
        an array containing the file descriptor 
    



    
    :returns Array:
        an array of files that are not loaded 
    


Filters a list of CSS files for a specific component and returns the files that don't exist
inside the registry.









    



register
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: CssRegistry#register(component, css)


    
    :param String component: 
        the component id for which to register the css 
    
    :param Array css: 
        the CSS contents to be registered 
    



    
    :returns Boolean:
        weather the insert was successful or not 
    


Register the css of a component to the registry.









    



unregister
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: CssRegistry#unregister(component)


    
    :param String component: 
        the component id for which to unregister the css 
    




Unregister a component from the registry.









    




    




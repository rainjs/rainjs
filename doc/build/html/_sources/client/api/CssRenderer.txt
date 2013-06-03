





..
    Classes and methods

Class CssRenderer
================================================================================

..
   class-title


Handles inserting and removing CSS into the page. The CSS is requested using AJAX and
the received CSS text is added to style tags with no more than 4095 rules. The maximum
number of stylesheets is 31. This is due to the limitations introduced by Internet
Explorer 8 and Internet Explorer 9 browsers.








    


Constructor
-----------

.. js:class:: CssRenderer()









Methods
-------

..
   class-methods


get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: CssRenderer.get()




    
    :returns CssRenderer:
        the singleton instance 
    


Returns the singleton instance.









    



load
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: CssRenderer#load(component)


    
    :param Object component: 
        the component for which to load the CSS. This is the object sent by the server when a component is rendered. 
    



    
    :returns Promise:
        indicates when the loading of the CSS finished. 
    


Requests the CSS files for the specified component and inserts the CSS into the page. The
promise returned by this method is rejected when there is not enough space to insert
the CSS in the page.









    



unload
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: CssRenderer#unload(component)


    
    :param Object component: 
        the component for which to unload the CSS. 
    




Removes the CSS from the page if the number of instances for the specified component
reaches 0.









    




    










..
    Classes and methods

Class URLHelper
================================================================================

..
   class-title











    


Constructor
-----------

.. js:class:: URLHelper()









Methods
-------

..
   class-methods


helper
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: URLHelper.helper(options)


    
    :param Object options: 
        the helper parameters and arguments 
    
    :param Object options.hash: 
        the helper key-value pairs 
    
    :param String options.hash.name: 
        the name of the component 
    
    :param String options.hash.version: 
        the component's version 
    
    :param String options.hash.path: 
        the path relative to the component's resources folder 
    
    :param Boolean options.hash.localized: 
        true to specify that the resource should be localized 
    




URL handlebars helper.

Tries to interpret the given URL as a resource URL. It supports
accessing the current component or other components.

It supports localized paths by specifying a "localized" boolean parameter.









    


.. code-block:: javascript

    Getting an image from the component's resource folder:
  <img src="{{url path="images/img.jpg"}}">

  Getting a localized image from the component's resource folder:
  <img src="{{url path="images/img.jpg" localized=true}}">

  Getting an image from another component
  (the localized parameter can also be specified here if needed):
  <img src="{{url name="other" version="1.0" path="images/img.jpg"}}">

  Getting an external image:
  <img src="{{url path="http://www.example.com/img.jpg"}}">

  Other uses:
  <div style="background: url('{{url path="images/background.jpg"}}') repeat-x 0 0;"></div>





    




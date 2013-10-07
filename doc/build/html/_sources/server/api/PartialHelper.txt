





..
    Classes and methods

Class PartialHelper
================================================================================

..
   class-title


This Handlebars helper is used to include partial templates.

The partial templates for a component are located in the ``client/partials`` folder and are
auto-discovered.

Syntax:

     {{partial path}}








    

Examples
--------


.. code-block:: javascript

    <span>
         {{partial "fileNameWithoutExtension"}}
         {{partial "dir/fileNameWithoutExtension"}}
         {{partial variableName}}
     </span>



Constructor
-----------

.. js:class:: PartialHelper()









Methods
-------

..
   class-methods


helper
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: PartialHelper#helper(path)


    
    :param String path: 
        the path of the partial to be rendered 
    



    
    :returns String:
        the markup generated for the partial helper 
    


Renders the partial template.









    




    




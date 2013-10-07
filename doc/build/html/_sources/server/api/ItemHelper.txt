





..
    Classes and methods

Class ItemHelper
================================================================================

..
   class-title


This Handlebars helper registers items inside a container, then passes them to the containers
data layer where they get processed and sent to the container view. A container that includes
*items* is known as a **Layout container**.

.. warning::

     A layout container can only contain items and any content found inside it will not get passed to
     the view and generate a warning.

Example::

     {{#container name="layout" view="horizontal" sid="hbox"}}
         {{#item column="0"}}
             {{! some content !}}
         {{/item}}
         {{#item column="1"}}
             {{! some more content !}}
         {{/item}}

         <div class="myDiv">Hello world</div> {{! this will generate a warning and be ignored !}}
     {{/container}}








    


Constructor
-----------

.. js:class:: ItemHelper()









Methods
-------

..
   class-methods


helper
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ItemHelper#helper(options)


    
    :param Object options: 
        the item options 
    




This helper renders its content and then registers it to be included inside the parent container.









    




    




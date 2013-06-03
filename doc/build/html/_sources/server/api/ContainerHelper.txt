





..
    Classes and methods

Class ContainerHelper
================================================================================

..
   class-title


The **Container** helper is a *block helper* that acts like a container for its content wrapping
it in a thin layer that allows it to act as if it is aggregated inside the parent component.

Complete syntax::

     {{#container view="viewID" [name="componentId" [version="versionNumber"]] [sid="staticId"]}}
         {{! Content !}}
     {{/container}}

Example::

     {{#component name="checkbox" view="group"}}
         {{#container name="myContainer" view="purple" sid="myPurpleContainer"}}
             {{#container name="myContainer" view="blue" sid="myBlueContainer"}}
                 {{! this gets aggregated inside the group component but gets rendered inside the containers !}}
                 {{component name="checkbox" view="index"}}
             {{/container}}
         {{/container}}
     {{/component}}








    


Constructor
-----------

.. js:class:: ContainerHelper()









Methods
-------

..
   class-methods


helper
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ContainerHelper#helper(options)


    
    :param Object options: 
        the container options 
    
    :param String options.name: 
        indicates the container from which the content will be aggregated. When this option is missing the current container will be used (the version is always the current version in this case). 
    
    :param String options.version: 
        the version of the container specified with the previous option. If the version is not specified the latest version will be used. You can also use version fragments as described in the documentation for container versioning. When you specify the version you also need to specify the name of the container, otherwise an error will be thrown. 
    
    :param String options.view: 
        the view that will be aggregated. 
    
    :param String options.sid: 
        the container static id, used in the client-side controller (*Default*: 'undefined')
    
    :param Boolean|Number|String|Object|Array options.customAttrN: 
        Sets a custom attribute which is extended to the context 
    


    
    :throws Error:
        : when the context has the wrong keys
    


    
    :returns String:
        the generated placeholder div with the instance id as id attribute 
    


The helper decides which view should use and from which container.

To determine which container and view to use, the following steps are performed:

1. the view id is required!

2. if the version is specified, the name of the container must be specified too.









    




    




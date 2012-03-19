================
Component Helper
================

The component helper is a custom Handlebars helper that is used to aggregate other components
inside the current component. It will generate a placeholder with an instanceId as ``id html attribute``
and calls the loading of the custom data for the template.

.. _handlebars-component-helper-usage:

-----
Usage
-----

The following example shows a component helper with all the options specified (this aggregates the 
*index* view from the *button* component, version *1.1* and the static id for this component is set
to *button1*)::

    {{component name="button" version="1.1" view="index" sid="button1"}}
    
You can also aggregate a view from the current component as in the following example::

    {{component view="index"}}

.. note::   
    When the component and version is not specified the version of the parent component is used.
    When only the version is not specified the latest version of the component is used.

-----------
HTML Output
-----------

The declaration ``{{component name="button" view="index"}}`` generates the following *custom* tag:

.. code-block:: html

    <div id="instanceID"></div>

-----------
Error Cases
-----------

When the component or the view isn't found a 404 error page will be shown. Also, the component helper
performs authorization before a view is shown. If the authorization fails a 401 error page is shown.

What happens is that in error cases the component is replaced with the error component.

.. seealso::

    :js:class:`ComponentHelper`
        Component Helper component API

    :doc:`../component_versioning`
        How RAIN handles multiple component versions

    :doc:`../authorization`
        Documentation describing how the authorization process takes place

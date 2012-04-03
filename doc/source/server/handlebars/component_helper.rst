================
Component Helper
================

The component helper is a custom Handlebars helper that is used to aggregate other components
inside the current component. It will generate a placeholder with an instanceId as
``id html attribute`` and calls the loading of the custom data for the template.

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

    When the component and version are not specified the version of the parent component is used.
    When only the version is not specified the latest version of the component is used.

^^^^^^^^^^^
Block usage
^^^^^^^^^^^

You can use the helper also as a block element. This use case can be better explained
through an example.

Suppose you need to create a **group of buttons** functionality, but also easily control
the html output. For the grouping page you must create a new view that uses the ``html`` key.
This means the view must contain the following code: ``{{html}}``.

The developer that uses the group view can write his code like this::

    {{#component name="button" view="group"}}

        My first button: {{component name="button" view="index" sid="button1"}}

        <div class="my_class">
            My second button here: {{component name="button" view="index" sid="button2"}}
        </div>

    {{/component}}

The ``group.html`` view can look like this::

    Below is the html inserted from the body of the block element

    <div>
        {{html}}
    </div>

    {{component name="button" view="index" sid="mandatory_button_in_group"}}

.. note::

    The ``html`` parameter name cannot be changed and is mandatory when using the component block
    element.

This usage is useful when you want to implement some logic but also give the developer a way to
customize the look and feel. In the previous example you can have a logic for how the grouped
buttons are behaving and the developer can decide how the place the buttons in the page.

-----------
HTML Output
-----------

The declaration ``{{component name="button" view="index"}}`` generates the following *custom* tag:

.. code-block:: html

    <div id="instanceID"></div>

-----------
Error Cases
-----------

When the component or the view isn't found a 404 error page will be shown.
When the authorization fails for a view a 401 error page is shown.
The error pages are views within the error component.

.. seealso::

    :js:class:`ComponentHelper`
        Component Helper component API

    :doc:`../component_versioning`
        How RAIN handles multiple component versions

    :doc:`../authorization`
        Documentation describing how the authorization process takes place

==========
CSS Helper
==========

The **CSS** helper is a custom Handlebars [#handlebars]_ helper that is used to declare references to CSS files
inside the current component or from other RAIN components. It collects the links corresponding to the location of the CSS file
and give it back to the component.

.. _handlebars-css-helper-usage:

-----
Usage
-----

The following line references the *index.css* file from the current component, found at the
following physical location: ``<component_folder>/client/css/index.css``::

{{css path="index.css"}}

The following line references the ``index.css`` file from the *button* component, version *1.1*::

{{css name="button" version="1.1" path="index.css"}}

.. note::

    The css helper declaration **must** include a *path* parameter that defines the location of the
    CSS file found in the ``<component_folder>/client/css/`` folder. This is the only parameter that
    is not optional.

-----------
HTML output
-----------

The declaration *{{css path="index.css"}}* generates the following *link* tag on client side:

.. code-block:: html

    <link type="text/css" rel="stylesheet" href="/componentId/componentVersion/css/index.css" />

The declaration *{{css name="button" version="1.1" path="index.css"}}* generates
the following *link* tag on client side:

.. code-block:: html

    <link type="text/css" rel="stylesheet" href="/button/1.1/css/index.css" />

.. seealso::

    :js:class:`CssHelper`
        CSS Helper API

    :doc:`../component_versioning`
        How RAIN handles multiple component versions

.. rubric:: Footnotes

.. [#handlebars] http://handlebarsjs.com/ Handlebars.js documentation

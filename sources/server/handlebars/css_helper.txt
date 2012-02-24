==========
CSS Helper
==========

The **CSS** helper is a custom Handlebars [#handlebars]_ helper that is used to declare references to CSS files
inside the current component or from other RAIN components. It will generate an HTML *link* tag
with the *href* attribute corresponding to the location of the CSS file.

.. _handlebars-css-helper-usage:

-----
Usage
-----

The following line references the *index.css* file from the current component, found at the
following physical location: ``<component_folder>/htdocs/css/index.css``::

{{css path="index.css"}}

The following line references the ``index.css`` file from the *button* component, version *1.1*::

{{css component="button" version="1.1" path="index.css"}}

.. note::

    The css helper declaration **must** include a *path* parameter that defines the location of the
    CSS file found in the ``<component_folder>/htdocs/css/`` folder. This is the only parameter that
    is not optional.

-----------
HTML output
-----------

The declaration *{{css path="index.css"}}* generates the following *link* tag:

.. code-block:: html

    <link rel="stylesheet" href="htdocs/css/index.css" type="text/css"/>

The declaration *{{css component="button" version="1.1" path="index.css"}}* generates
the following *link* tag:

.. code-block:: html

    <link rel="stylesheet" href="webcomponent://button;1.1/htdocs/css/index.css" type="text/css"/>

.. note::

    When the component id and / or version is declared and the pair corresponds to the current
    component, the output will not use the ``webcomponent`` prefix and instead just reference the
    file located in the current component's folder structure.

.. seealso::

    :js:class:`CssHelper`
        CSS Helper API

    :doc:`../component_versioning`
        How RAIN handles multiple component versions

.. rubric:: Footnotes

.. [#handlebars] http://handlebarsjs.com/ Handlebars.js documentation

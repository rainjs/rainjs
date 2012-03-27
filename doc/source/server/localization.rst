=================
RAIN Localization
=================

RAIN provides features to localize text, templates and static resources. Depending on the
localization needs, these features can be used on the client-side, server-side or both.

The localization process uses the current platform language and tries to localize the requested
resource. If the resource is not found it tries to use the default platform language. If this
fails also, a default action is taken.

-----------------
Text localization
-----------------

Text can be localized both on client-side and on server-side.

^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Text localization on server-side
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

On the server-side, text can be localized in two places:

- templates
- controllers

In **templates**, when you need some text localized, you can use the ``t`` and ``nt`` Handlebars
helpers. For a more detailed description, input parameters and examples of how to use the helpers
check the API documentation here: :js:class:`Translation Helper <TranslationHelper>`,
:js:class:`Plural Translation Helper <TranslationPluralHelper>`.

In **controllers** you can use the ``t`` and ``nt`` global functions. Check the API documentation
for more information and examples: :js:class:`Translation functions <Translation>`.

.. warning::

    You shouldn't declare functions named ``t`` or ``nt`` in the server-side controllers because
    the global translation functions will be overridden by them.

-------------
Resource URLs
-------------

A resource URL path has several parts separated by the '/' character:

1. component id - the component that has the required resource
2. component version - the component version (this is optional)
3. resources - a static path identifier
4. path - the path to the file, related to the ``resources`` folder

Here are some examples of resource URLs:

- ``/example/3.0/resources/images/flag.png``
- ``/hello_world/resources/file.pdf``

Use :js:class:`Url Helper <UrlHelper>` for easier handling.

^^^^^^^^^^^^^^^^^^^^^^
Resources localization
^^^^^^^^^^^^^^^^^^^^^^

The static resource files for a component are located in the ``<component_folder>/resources/``
folder. There are multiple ways to generate the URLs for them:

- in template files: using the :js:class:`Url Helper <UrlHelper>`
- in all files: directly constructing the url path

RAIN provides a very easy way to localize resources. Just add the ``loc`` query parameter to the
URL path. E.g.:

- unlocalized image: ``/example/3.0/resources/images/flag.png``
- localized image: ``/example/3.0/resources/images/flag.png?loc``

Localized resources are placed in the same folder with the other resources. They only add a locale 
suffix to the file name like ``flag_de_DE.png`` for german language if the original file name is ``flag.png``.

------------------
Views localization
------------------

Views can be localized by adding a locale suffix to the view name (``index_de_DE.html`` for ``index.html``).
First, Rain tries to use the view for the platform language. If this view doesn't exist it tries to use
the view for the default platform language. If this is missing it will take the view for `en_US` with no language 
suffix.

.. warning::

    Templates without a suffix are related to `en_US`!
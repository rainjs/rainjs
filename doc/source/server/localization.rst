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

There are two ways to use t and nt.

1. The first one is just by using a message id. This way, the classic translation is returnd if
found, otherwise the message id is returned.

.. code-block:: javascript

    // messages.po
    msgid "Translate"
    msgstr "Traduce"

    t('Translate'); // -> Traduce
    t('foo'); // -> foo


2. The second one is by using a structured custom message id. This way, you have to provide a
structured custom message id and a classic message id. The translation of the structured id is
returned if found, otherwise the classic message id is returned. The classic message id is always mandatory.

.. code-block:: javascript

    // messages.po
    msgid "button.label"
    msgstr "Traduce"

    t('button.label', 'foo'); // -> Traduce
    t('invalid.button.label', 'foo'); // -> foo


^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Text localization on the server-side
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

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
    the global translation functions will be hidden by the new declarations.

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

Localized resources are placed in the same folder with the other resources. The file name for a
localized resource has a locale sufffix. For example, for the german language, ``flag_de_DE.png``
is the localized version for ``flag.png``.

------------------
Views localization
------------------

Views can be localized by adding a locale suffix to the view name (``index_de_DE.html`` for
``index.html``). First, Rain tries to use the view for the platform language. If this view doesn't
exist it tries to use the view for the default platform language. If this is missing it will take
the view for `en_US` with no language suffix.

.. warning::

    Templates without a suffix are related to `en_US`!

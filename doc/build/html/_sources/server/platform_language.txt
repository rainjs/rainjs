=================
Platform language
=================

The platform accepts, in the configuration file, information about the language that will be used
to decide what templates to use in the rendering process, what translation text to use when the
translation functions are used, etc.

-------------
Configuration
-------------

The default server configuration file is located in the ``conf/server.conf.default`` file. There
are two important properties related to language:

- ``defaultLanguage`` - the platform default language
- ``language`` - the current language

The configuration **must** have a ``defaultLanguage`` key that specifies the language that will be
used when:

- the current language is not specified
- a view / translation is not found for the current language.

If the ``language`` key is not specified, it will default to the ``defaultLanguage`` value.

E.g. **en_US**, **en_UK**, **de_DE**.

------------------
Using the language
------------------

In the server-side controllers the language can be obtained from the ``environment`` parameter
that is automatically added to the necessary methods. This object will have a property
``language`` that will return the current language.

.. seealso::

    :js:class:`Environment`
        Environment object API

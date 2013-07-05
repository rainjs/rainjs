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
Text localization on the client-side
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The localization process uses the current platform language and tries to localize the requested
resource. If the resource is not found it tries to use the default platform language. If this
fails also, a default action is taken.

On the client-side, text can be localized in any JavaScript file that is loaded though the requireJS
module system.

Localization on the client side is done through the ``t`` and ``nt`` functions provided by the
framework. You need to include them as dependencies like so::

    define(['mycomp/js/lib/myModule', 't', 'nt'], function (myModule, t, nt) {
        t('my string')
    });

The translation used can be found in the ``locale`` folder inside your component under
``<locale>/messages.po``, and they will be automatically loaded by the framework when your client
side controller is initialised if ``t`` and ``nt`` are included in the dependencies.

.. note::

    When translating a string RAIN will first look it up in the messages defined for the platform
    language. If it does not find it there, it will then fallback to looking for them in the
    platforms default language. If the message cannot be found, the string passed to the translation
    function will be returned.

.. seealso::

    :js:class:`Translation`
        Translation functions (t and nt)

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

^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Text localization on the client-side
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

On the client-side, text can be localized in any JavaScript file that is loaded though the requireJS
module system.

Localization on the client side is done through the ``t`` and ``nt`` functions provided by the
framework, and the only thing you need to do is to include them as the last two paramaters of the
callback passed to ``define`` or ``require`` like so::

    define(['mycomp/js/lib/myModule'], function (myModule, t, nt) {
        t('my string')
    });

.. warning::

    Failing to include the t and nt functions at the end of the parameter list will make them
    unavailable to your code, and RAIN has no way of explicitly determining if you have used them
    in your code, so you will have runtime errors due to the functions being undefined.

The translation used can be found in the ``locale`` folder inside your component under
``<locale>/messages.po``, and they will be automatically loaded by the framework when your client
side controller is initialised.

.. note::

    When translating a string RAIN will first look it up in the messages defined for the platform
    language. If it does not find it there, it will then fallback to looking for them in the
    platforms default language. If the message cannot be found, the string passed to the translation
    function will be returned.

.. seealso::

    :js:func:`t`
        the ``t`` function documentation

    :js:func:`nt`
        the ``nt`` function documentation

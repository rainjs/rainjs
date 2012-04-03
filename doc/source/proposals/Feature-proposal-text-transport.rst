==============
Text transport
==============

Rain should support sending the translation files to the client in order to be able to localize code
written in the client logic.

This proposal treats this case by suggesting that a separate route be implemented for localization
files, possibly under ``/<component>/<version>/locale.`` Note that the name of the localization has
been omitted. That is because typically there should only be one localization file exposed per
component.

.. _text-transport-format:

------
Format
------

The localization file exposed to the client should be formatted as a JSON file, containing the
messages in both the server language and the default language, in case there are message ids defined
in the default language that do not exist in the configured language (this can be better described
as a mathematical set union).

A example of a translation file could be::

    {
        "textdomain": "messages",
        "options": {
            "domain": "messages",
            "locale_data": {
                "messages": {
                    "Sincerely,": [ null, "Cu stimă,", [length]: 2 ],
                    "Send email": [ null, "Send email", [length]: 2 ]
                }
            }
        },
        "defaults": {
            "domain": "messages",
            "locale_data": {
                "messages": {
                    "": {
                        "lang": "en",
                        "plural_forms": "nplurals=2; plural=(n != 1);",
                        "domain": "messages"
                    }
                }
            }
        }
    }

This file could be served from disk or from memory, since it will probably be loaded on server
startup so that in can be used by the server side localization functions.

------------------------
Client side requirements
------------------------

The JSON file described in :ref:`text-transport-format` should be requested by the client as a
dependency of the client side controller (this way the client side controller has the translation
data available).

For this to work we need a JSON plugin for requirejs (there is one already written).

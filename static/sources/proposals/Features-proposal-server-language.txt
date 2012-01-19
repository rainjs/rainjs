==========================
Server Translations System
==========================

This document describes how the translations system is defined and used on the server side.

-----------------------
Functional requirements
-----------------------

1. The translation files must be discovered automatically for all supported languages.
2. The translation system must support *properties* and *po* files.
3. A component must be able to import translations from another component.
4. The translation system must support simple text keys:

   - simple keys that support input parameters.
   - the translated text is a string in the specified language or in the server's default language.
   - if the key is not translated in one of the required languages, a default "*key 'x' is not translated in language 'y'*" key must be returned.
5. In the future we may want to define additional types of keys:

   - *composed keys* from simple text, text keys and other composed keys (the translated text contains references to other keys).

------
Markup
------

1. Import translations from another component:

   - {{translation 'webcomponent://commontranslations;1.0'}}
2. Text key:

   - {{key 'message_1'}}
   - {{key 'message_1' 'en_US'}}

*translation* and *key* are Handlebars block helpers. The *key* helper generates the translated text for the specified key.

---------
Discovery
---------
Here is an example for a folder structure:
::

    appname/htdocs/locales
                         \
                         |
                         |- en_US
                         |      \
                         |      |- media
                         |      |      \
                         |      |      |- image1.png
                         |      |      |- audio2.mp3
                         |      |      |- video3.mp4
                         |      |      |- video4.ogg
                         |      |- messages.po
                         |      |- other.po
                         |      |- keys.properties
                         |      o
                         |
                         |- de_DE
                         |      \
                         |      |- messages.po
                         |      |- other.po
                         |      o
                         |
                         |- fr_FR
                         o      \
                                |- messages.po
                                |- other.po
                                o

-----------------------------------------------
Media keys - Currently NOT planned to implement
-----------------------------------------------

1. Keys that are used for media elements (images, audio or video) that require multiple attributes.
2. The translated value is a JSON object with all the key's properties in the specified language or in the server's default language.
3. A media key property can be a reference to a text key.
4. If the key is not translated in one of the required languages, an empty JSON object should be returned.

^^^^^^
Markup
^^^^^^

1. <img {{mkey 'img_1'}}">
2. <img {{mkey 'img_1' 'en_US'}}">

*mkey* is a Handlebars block helper. The media key helper generates the attributes based on the JSON object that represents a translation (example of generated text: "src='url' alt='text'").

Here is an example of a media messages translation file (en_US/media_messages.js):

.. code-block:: javascript
    :linenos:

    {translations : {
       "image_key_1" : {
          "type"   : "image",
          "src"    : "images/image1.png",
          "alt"    : "alternative localized text - en version", // use "key:message_1" when referencing a text key
          "width"  : "32",
          "height" : "32"
       }
    }}

--------------------
Dynamic translations
--------------------

The translations for a component are considered dynamic when they are provided by an entity external to the component, like a web service. Each time a component is rendered, a request is made to the web service to retrieve the translations for the component with the specified version. The returned translations must be cached on the RAIN server in order to avoid multiple unnecessary requests.

^^^^^^^^^^^^^^^^^^^^^^^
Functional requirements
^^^^^^^^^^^^^^^^^^^^^^^

1. The web service must provide methods for:

   1. Obtaining translations:

      - obtaining the list of translation versions for a component.
      - obtaining the translations for a component for a specific version in one or more languages.
   2. Changing / updating translations:

      - delete a translation key.
      - update the text for a translation key for a component, for a specific version and language.
      - delete all translations for a component for a specific version and language.
2. The RAIN Mothership must provide methods for:

   - invalidating cached translations.

The RAIN servers will cache all the translations that they receive from the web service and they keep them until they are notified otherwise. The notification is made by the RAIN Mothership, so a RAIN server must be able to receive them.

The translation web service MUST notify the RAIN Mothership when a translation for a component was changed, in order to notify all the RAIN servers that have cached those translations to invalidate the cache.


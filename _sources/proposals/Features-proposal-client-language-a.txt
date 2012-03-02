====================================
Client Language Runtime (Proposal A)
====================================

This document describes all features offered by RAIN client runtime for interacting with localization.

-----------------------
Functional requirements
-----------------------

1. Language runtime must provide support for:

   - accessing preferences.
   - obtaining supported languages.
   - obtaining the current language of the application.
   - changing the language of the application.
2. Language runtime must provide support for the following categories of requirements:

   1. Language requirements

      - obtaining the character encoding.
      - obtaining the writing direction.
   2. Culture requirements

      - formatting numbers and dates / times.
      - formatting telephone numbers.
      - formatting addresses.
      - formatting currencies.
3. Language runtime must provide translations access from client side controllers for:

   - obtaining the list of translation keys and their values for a component.
   - checking if a translation key is declared.
   - obtaining the value of a key in a specified language.
   - changing the value for a key (if authorized).
   - adding new translation keys (if authorized).
4. Language runtime must supply the specified default language for the server (e.g. American English ("en_US")) and every translation key should provide a translation for that language. In case of a missing translation in the required language or the default language, a default "*key 'x' is not translated in language 'y'*" should be returned.

---------------------------
Non functional requirements
---------------------------

1. RAIN language runtime must support properties files.
2. RAIN language runtime must support po files.

----
APIs
----

1. ClientLanguageRuntime

   - getClientLanguageUtil(language: Language) : ClientLanguageUtil
   - getSupportedLanguages() : Language[]
   - changeLanguage(language : Language)
   - getClientLanguage() : ClientLanguage
   - getCurrentLanguage() : Language
   - getKeyValue(elemId : String, language : Language) : String
   - saveKeyValue(elemId : String, value : JSON)
   - existsKey(elemId : String) : boolean
2. Language

   - getLanguageCode() : String
   - getCountryCode() : String
3. ClientLanguage

   - getCharacterEncoding() : String
   - getWritingDirection() : String
4. ClientLanguageUtil

   - formatNumber(text : String) : String
   - formatPhoneNumber(text : String) : String
   - formatDate(date : Date, format : String) : String
   - formatAddress(address : JSON) : String
   - formatCurrency(value : String, currency : String) : String

Client Language Runtime methods work by default with the current selected language. Some methods allow an optional "language" parameter that will be used instead of the current language if defined.

---------
Use cases
---------

^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Displaying localized error messages
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Imagine we do an ajax request and based on some conditions when we receive an http error status code we want to display a friendly localized message.

^^^^^^^^^^^^^^^^^^^^^^^^
Complex translation keys
^^^^^^^^^^^^^^^^^^^^^^^^

Imagine we have a list of help messages and depending on the language we want to display some of them or all. We may want to declare a "help" complex key like this: *help={key:msg1} {key:msg2} {key:msg3}*, where msg1, msg2, msg3 are other keys. This way we can achieve a composition of translations.

In this scenario we must be careful when passing parameters to the complex translation key, so that every "inline" key receives the exact number of parameters that it requires.

^^^^^^^^^^^^^^^^^^^^^^
Language change action
^^^^^^^^^^^^^^^^^^^^^^

Imagine a fragment that is displayed within an aggregator. The aggregator contains a dropdown that allows users to change the language. In this case each fragment from the aggregator should reload the translations.
Moreover, when moving to the next aggregator, the selected language should be the one changed in the previous aggregator.

^^^^^^^^^^^^^^
Inline editing
^^^^^^^^^^^^^^

Imagine we create an application which contains multiple views. From a developer perspective, we add some text which might be changed over time. Without inline editing, the developer becomes responsible for changing the text. For additional information about this read :doc:`/proposals/Features-proposal-client-language-inline-editing`.

--------------
Implementation
--------------

^^^^^^^^^^^^^^
Data structure
^^^^^^^^^^^^^^

After RAIN parser finished parsing the document and the markup is completed rendered the following data structure is used for holding translations (available on client side):

.. code-block:: javascript
    :linenos:

    {translations : {
      "id1" : {
        "en_US" : 'localized text - en version',
        "de_DE" : 'localized text - de version'
      },
      "id2" : {
        "en_US" : 'localized text - en version'
      }
    }}

The client side controller holds a reference to this structure in viewContext object.

---------------------
Change language event
---------------------

Change language operation publishes an event at page level that can be handled by each module individually.

^^^^^^^^^^^^^^^^
Generated markup
^^^^^^^^^^^^^^^^

.. code-block:: javascript
    :linenos:

    <html>
    <head>
       <link rel="stylesheet" href="rain specific url for consolidated css" />
       <script type="text/javascript" src="js/require-jquery.js"></script>
       <script type="text/javascript">
         require(["js/test_controller.js"], function(module) {
             ..... contexts specific code come here
             module.init(viewContext);
         });  
       </script>
    </head>

    <body>
    <div id="module5" class="module1">
       <div class="fragment1" id="fragment1">
          <img id="img1" alt="Default de_DE" src="de_DE_img.jpg" />
          <p id="p1"></p>
       </div>
    </div>
    </body>
    </html>

^^^^^^^^^^^^^^^^^^^^^^
Client side controller
^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript
    :linenos:

    define(function() {
       function init(viewContext) {
          var languageRuntime = this.clientRuntime.clientLanguageRuntime;
          var messaging = this.clientRuntime.messaging;
          var parentDiv = $("#" + this.viewContext.getInstanceId());

          // obtain paragraph innerText using client runtime.
          messaging.subscribe("languageChanged", function(data) {
              var pText = languageRuntime.getKeyValue("id1");
              parentDiv.find("#p1").html(pText);
          });
       }

       return {init : init};
    });


--------------------------------
Default change language behavior
--------------------------------

It would be nice that RAIN provides a default behavior for handling "languageChanged" event. For this to work we need to have access to all client side controllers from page. Then each view might override this behavior by subscribing to "languageChanged" event.

-----------------------------------------------
Media keys - Currently NOT planned to implement
-----------------------------------------------

When displaying information about images, audios or videos (media elements) we have multiple attributes for these tags. The simpler way is to add different translation keys for each attribute. For an image we may need to following attributes: src, alt, width, height; a video has sources and poster attributes. Changing all these attributes (or adding new ones that are not initially known) for a media element might require developer involvement.

We can improve this update translations process by defining a new type of keys: media keys. We will associate a key with a media tag and generate the element attributes on the fly based on the list of attributes contained in the translation object. The translation of the key will be a JSON object with keys being the attributes names.

This will add two additional API methods to the language runtime:
 - getMediaKeyValue(elemId : String, language : Language) : JSON
 - saveMediaKeyValue(elemId : String, value : JSON)

^^^^^^^^^^^^^^
Data structure
^^^^^^^^^^^^^^

.. code-block:: javascript
    :linenos:

    {translations : {
      "id2" : {
        "en_US" : {
          "type"   : 'image',
          "src"    : 'url to img source - en version',
          "alt"    : 'alternative localized text - en version',
          "width"  : '32',
          "height" : '32'
        },
        "de_DE" : {
          "type"   : 'image',
          "src"    : 'url to img source - de version',
          "alt"    : 'alternative localized text - de version'
        }
      },
      "id3" : {
        "en_US" : {
          "type"   : 'video',
          "src"    : 'url to video source - en version',
          "poster" : 'url to poster image - en version',
          "width"  : '32',
          "height" : '32',
          "sources" : [
            {
              "src"  : 'url to video source 1 - en version',
              "type" : 'video/mp4'
            },
            {
              "src"  : 'url to video source 2 - en version',
              "type" : 'video/ogg'
            }
          ]
        }
      }
    }}

^^^^^^^^^^^^^^^^
Generated markup
^^^^^^^^^^^^^^^^

.. code-block:: html
    :linenos:

    <html>
    <head>
       <link rel="stylesheet" href="rain specific url for consolidated css" />
       <script type="text/javascript" src="js/require-jquery.js'></script>
       <script type="text/javascript">
         require(["js/test_controller.js"], function(module) {
             ..... contexts specific code come here
             module.init(viewContext);
         });
       </script>
    </head>

    <body>
    <div id="module5" class="module1">
       <div class="fragment1" id="fragment1">
          <img id="img1" alt="Default de_DE" src="img_de_de.jpg" />
       </div>
    </div>
    </body>
    </html>

^^^^^^^^^^^^^^^^^^^^^^
Client side controller
^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript
    :linenos:

    define(function() {
       function init(viewContext) {
          var languageRuntime = this.clientRuntime.clientLanguageRuntime;
          var parentDiv = $("#" + this.viewContext.getInstanceId());

          // obtain paragraph innerText using client runtime.
          var imgObj = languageRuntime.getMediaKeyValue("id2");
          parentDiv.find("#img1").attr("src", imgObj.src);
          parentDiv.find("#img1").attr("alt", imgObj.alt);
       }

       return {init : init};
    });

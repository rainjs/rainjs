=======================
Client Language Runtime
=======================

This document describe all features offered by RAIN client runtime for interacting with localization.

-----------------------
Functional requirements
-----------------------

   1. Language runtime must provide translations access from client side controllers.
   2. Language runtime must provide support for changing translations (if authorized).
   3. Language runtime must provide support for accessing preferences.
   4. Language runtime must provide support for formating texts (numbers, dates, time zones and others).
   5. Language runtime must provide support for obtaining supported languages.
   6. Language runtime must provide support for changing the language of the application.
   7. Language runtime must provide support for obtaining the current language of the application.
   8. Language runtime must provide support for the following categories or requirements:

      1. Language requirements

         1. Language service must provide support for obtaining the character encoding.
         2. Language service must provide support for obtaining the writing direction.
         3. Language service must provide support for obtaining plural of words.
      2. Culture requirements

         1. Culture service must provide support for formatting telephone numbers.
         2. Culture service must provide support for formatting addresses.
         3. Culture service must provide support for formatting currency.
         4. Culture service must provide support for paper settings.
      3. Writing requirements

         1. Writing service must provide support for formatting date / time.
         2. Writing service must provide support for formatting numbers.

---------------------------
Non functional requirements
---------------------------

   1. RAIN language runtime must support properties files.
   2. RAIN language runtime must support po files.

------
Design
------

.. image:: ../images/proposals/client_language_runtime.png

Client Language Runtime methods work only with the current selected language. This is why we do not need to specify the language anywhere in this API.

---------
Use cases
---------

-----------------------------------
Displaying localized error messages
-----------------------------------

Imagine we do an ajax request and based on some conditions when we receive an http error status code we want to display a friendly localized message.

----------------------
Language change action
----------------------

Imagine a fragment that is displayed within an aggregator. The aggregator contains a dropdown that allows users to change the language. In this case each fragment from the aggregator should reload the translations.
Moreover, when moving to the next aggregator, the selected language should be the one changed in the previous aggregator.

--------------
Inline editing
--------------

Imagine we create an application which contains multiple views. From a developer perspective, we add some text which might be changed over time. Without inline editing, developer become responsible for changing text. The way this might be done in RAIN is using inline editing and client language runtime. Client Language Runtime will simply submit the changes to RAIN server which will change the specified keys.

--------------
Implementation
--------------

--------------
Data structure
--------------

After RAIN parser finish parsing the document and markup is completed rendered the following data structure is used for holding translations (available on client side):

.. code-block:: javascript
    :linenos:

    {"translations" : {
      "id1" : {
        "ro_RO" : {
          // ..... entries for all html tag attributes in ro
          "innerText" : 'localized text - ro version'
        },
        "de_DE" : {
          // ..... entries for all html tag attributes in de
          "innerText" : 'localized text - de version'
        }
      }
    }}

The client side controller holds a reference to this structure in viewContext object.

------
Markup
------

There is only one addition to standard html tag attributes specific to RAIN: data-gettext. Each tag data-gettext atttribute will point to an entry from the above mentioned data structure. This is also how client runtime will be able to solve dynamic translations.

--------------
Usage examples
--------------

------------
Simple usage
------------

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
          <img data-gettext="fragment1_1" alt="Default de_DE" src="img_de_de.jpg" />

          <!-- initial empty text -->
          <p id="p1" data-gettext="id1" alt=""></p>
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
          var languageRuntime = viewContext.getClientRuntime().getClientLanguageRuntime();
          var parentDiv = $("#" + viewContext.getInstanceId());

          // obtain paragraph innerText using client runtime.
          var pText = languageRuntime.getText(viewContext, "id1");
          parentDiv.find("#p1").html(pText.innerText);
          parentDiv.find("#p1").attr("alt", pText.alt);
       }

       return {init : init};
    });

The code above requires some explanation. The basic idea is that we don't want to access a single translation key. Actually we want to obtain the dictionary that holds all translation information for a specified element.

---------------------
Change language event
---------------------

Change language operation publish an event at page level that can be handled by each module individually.

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
          <img data-gettext="fragment1_1" alt="Default de_DE" src="img_de_de.jpg" />

          <!-- initial empty text -->
          <p id="p1" data-gettext="id1" alt=""></p>
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
          var languageRuntime = viewContext.getClientRuntime().getClientLanguageRuntime();
          var messagingRuntime = viewContenxt.getClientRuntime().getMessaging().getClientMessaging();
          var parentDiv = $("#" + viewContext.getInstanceId());

          // obtain paragraph innerText using client runtime.
          messagingRuntime.subcribe("languageChanged", function(data) {
              var pText = languageRuntime.getText(viewContext, "id1");
              parentDiv.find("#p1").html(pText.innerText);
              parentDiv.find("#p1").attr("alt", pText.alt);
          });
       }

       return {init : init};
    });

--------------------------------
Default change language behavior
--------------------------------

It would be nice that RAIN provides a default behavior for handling changeLanguaged event. For this to work we need to have access to all client side controllers from page. Then each view might override this behavior by subscribing to languageChanged event.

TBD